import type { AgentStreamEvent } from '@/services/kubeflare/agent';
import { getAgentRouteSourceLabel, getAgentTypeLabel } from './agent';
import { getAgentDisplayErrorMessage } from './agentError';

export type AgentTimelineItemKind =
  | 'answer'
  | 'error'
  | 'evidence'
  | 'plan'
  | 'route'
  | 'run'
  | 'thinking'
  | 'tool';

export type AgentTimelineItemStatus =
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'info'
  | 'pending'
  | 'running';

export type AgentTimelineItem = {
  id: string;
  kind: AgentTimelineItemKind;
  title: string;
  content?: string;
  meta?: string[];
  order: number;
  status?: AgentTimelineItemStatus;
  timestamp?: number;
};

type BuildAgentRunTimelineOptions = {
  answerContent?: string;
  errorMessage?: string;
  evidences?: API.AgentEvidence[];
  metrics?: API.AgentRunMetrics;
  route?: API.AgentRouteResult;
  run?: API.AgentRun;
  toolCalls?: API.AgentToolCall[];
};

type ApplyAgentStreamTimelineOptions = {
  answerContent?: string;
};

const toTimestamp = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
};

const normalizeText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const buildMetaList = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter(Boolean) as string[]));

export const getNextAgentTimelineOrder = (items: AgentTimelineItem[]) =>
  items.reduce((maxOrder, item) => Math.max(maxOrder, item.order), 0) + 1;

export const sortAgentTimelineItems = (items: AgentTimelineItem[]) =>
  [...items].sort((first, second) => {
    if (first.order !== second.order) {
      return first.order - second.order;
    }

    const firstTime = first.timestamp ?? Number.MAX_SAFE_INTEGER;
    const secondTime = second.timestamp ?? Number.MAX_SAFE_INTEGER;
    return firstTime - secondTime;
  });

export const upsertAgentTimelineItem = (
  items: AgentTimelineItem[],
  item: AgentTimelineItem,
) => {
  if (!items.some((existing) => existing.id === item.id)) {
    return sortAgentTimelineItems([...items, item]);
  }

  return sortAgentTimelineItems(
    items.map((existing) =>
      existing.id === item.id
        ? {
            ...existing,
            ...item,
            order: existing.order,
          }
        : existing,
    ),
  );
};

const appendAgentTimelineItem = (
  items: AgentTimelineItem[],
  item: Omit<AgentTimelineItem, 'id' | 'order'> & { id?: string },
) =>
  sortAgentTimelineItems([
    ...items,
    {
      ...item,
      id: item.id || `${item.kind}-${getNextAgentTimelineOrder(items)}`,
      order: getNextAgentTimelineOrder(items),
    },
  ]);

const settleRunningTimelineItems = (
  items: AgentTimelineItem[],
  status: Extract<AgentTimelineItemStatus, 'completed' | 'failed'>,
) =>
  items.map((item) =>
    item.status === 'running'
      ? {
          ...item,
          status,
        }
      : item,
  );

const getToolTimestamp = (toolCall: API.AgentToolCall) =>
  toTimestamp(toolCall.completed_at) || toTimestamp(toolCall.started_at);

const getToolStatus = (
  status?: API.AgentToolCallStatus,
): AgentTimelineItemStatus =>
  status === 'failed'
    ? 'failed'
    : status === 'completed'
      ? 'completed'
      : 'running';

const getToolTitle = (toolCall: API.AgentToolCall) =>
  `调用工具 ${toolCall.tool_id || '-'}`;

const getToolContent = (toolCall: API.AgentToolCall) =>
  normalizeText(toolCall.error_message) ||
  normalizeText(toolCall.output_summary) ||
  undefined;

const buildRouteTimelineItem = (
  route?: API.AgentRouteResult,
  run?: API.AgentRun,
  order = 1,
): AgentTimelineItem | undefined => {
  const agentType = route?.agent_type || run?.agent_type;
  const routeSource = route?.source || run?.route_source;
  const reason = route?.reason || run?.route_reason;

  if (!agentType && !routeSource && !reason) {
    return undefined;
  }

  return {
    id: 'route',
    kind: 'route',
    title: `路由到 ${getAgentTypeLabel(agentType)}`,
    content: normalizeText(reason),
    meta: buildMetaList([
      routeSource ? getAgentRouteSourceLabel(routeSource) : undefined,
      typeof route?.confidence === 'number'
        ? `置信度 ${Math.round(route.confidence * 100)}%`
        : typeof run?.confidence === 'number'
          ? `置信度 ${Math.round(run.confidence * 100)}%`
          : undefined,
    ]),
    order,
    status: 'completed',
    timestamp: toTimestamp(run?.created_at),
  };
};

export const buildAgentRunHistoryTimeline = ({
  answerContent,
  errorMessage,
  evidences = [],
  metrics,
  route,
  run,
  toolCalls = [],
}: BuildAgentRunTimelineOptions) => {
  let order = 0;
  const items: AgentTimelineItem[] = [];
  const push = (item?: Omit<AgentTimelineItem, 'order'>) => {
    if (!item) {
      return;
    }
    order += 1;
    items.push({ ...item, order });
  };

  push(buildRouteTimelineItem(route, run, order + 1));

  if (run) {
    push({
      id: 'run-created',
      kind: 'run',
      title: '创建 Run',
      content: normalizeText(run.input),
      status: 'completed',
      timestamp: toTimestamp(run.created_at),
    });
  }

  if (metrics?.plan_generated) {
    push({
      id: 'plan-generated',
      kind: 'plan',
      title: metrics.replan_count > 0 ? '生成并重规划诊断计划' : '生成诊断计划',
      meta:
        metrics.replan_count > 0 ? [`重规划 ${metrics.replan_count} 次`] : [],
      status: 'completed',
      timestamp: toTimestamp(run?.created_at),
    });
  }

  if ((metrics?.step_count || 0) > 0 || toolCalls.length > 0) {
    push({
      id: 'thinking',
      kind: 'thinking',
      title: '推理并选择取证路径',
      meta: buildMetaList([
        metrics?.step_count ? `步骤 ${metrics.step_count}` : undefined,
        metrics?.tool_call_count
          ? `工具 ${metrics.tool_call_count}`
          : undefined,
      ]),
      status: run?.status === 'failed' ? 'failed' : 'completed',
      timestamp: toTimestamp(run?.created_at),
    });
  }

  toolCalls.forEach((toolCall) => {
    push({
      id: `tool-${toolCall.id}`,
      kind: 'tool',
      title: getToolTitle(toolCall),
      content: getToolContent(toolCall),
      status: getToolStatus(toolCall.status),
      timestamp: getToolTimestamp(toolCall),
    });
  });

  evidences.forEach((evidence) => {
    push({
      id: `evidence-${evidence.id}`,
      kind: 'evidence',
      title: `生成证据 ${evidence.resource_kind || evidence.source_kind || '-'}`,
      content: normalizeText(evidence.summary),
      meta: buildMetaList([
        evidence.namespace ? `ns/${evidence.namespace}` : undefined,
        evidence.name,
      ]),
      status: 'completed',
      timestamp: toTimestamp(evidence.collected_at),
    });
  });

  const answer = normalizeText(answerContent) || normalizeText(run?.summary);
  if (answer) {
    push({
      id: 'answer',
      kind: 'answer',
      title: '输出最终回答',
      content: answer,
      status: run?.status === 'failed' ? 'failed' : 'completed',
      timestamp: toTimestamp(run?.completed_at),
    });
  }

  const error =
    normalizeText(errorMessage) || normalizeText(run?.error_message);
  if (error) {
    push({
      id: 'error',
      kind: 'error',
      title: '执行失败',
      content: getAgentDisplayErrorMessage(error),
      status: 'failed',
      timestamp: toTimestamp(run?.completed_at),
    });
  }

  return sortAgentTimelineItems(items);
};

export const applyAgentStreamTimelineEvent = (
  items: AgentTimelineItem[],
  event: AgentStreamEvent,
  options: ApplyAgentStreamTimelineOptions = {},
) => {
  const order = getNextAgentTimelineOrder(items);
  const now = Date.now();

  if (event.event === 'agent.route.completed') {
    const item = buildRouteTimelineItem(event.route, event.run, order);
    return item ? upsertAgentTimelineItem(items, item) : items;
  }

  if (event.event === 'agent.run.created') {
    return upsertAgentTimelineItem(items, {
      id: 'run-created',
      kind: 'run',
      title: '创建 Run',
      content: normalizeText(event.run?.input),
      order,
      status: 'completed',
      timestamp: toTimestamp(event.run?.created_at) || now,
    });
  }

  if (event.event === 'agent.plan.created') {
    return upsertAgentTimelineItem(items, {
      id: 'plan-created',
      kind: 'plan',
      title: '开始生成诊断计划',
      order,
      status: 'running',
      timestamp: now,
    });
  }

  if (event.event === 'agent.plan.generated') {
    const existingPlanCount = items.filter(
      (item) => item.kind === 'plan',
    ).length;
    const nextItems = upsertAgentTimelineItem(items, {
      id: 'plan-created',
      kind: 'plan',
      title: '诊断计划已生成',
      order,
      status: 'completed',
      timestamp: now,
    });

    return appendAgentTimelineItem(nextItems, {
      kind: 'plan',
      title: existingPlanCount > 1 ? '更新诊断计划' : '生成诊断计划',
      content: normalizeText(event.delta),
      status: 'completed',
      timestamp: now,
    });
  }

  if (event.event === 'agent.thinking') {
    return appendAgentTimelineItem(items, {
      kind: 'thinking',
      title: '推理思考',
      content: normalizeText(event.delta),
      status: 'completed',
      timestamp: now,
    });
  }

  if (
    event.event === 'agent.tool.started' ||
    event.event === 'agent.tool.completed' ||
    event.event === 'agent.tool.failed'
  ) {
    if (!event.tool_call?.id) {
      return items;
    }

    return upsertAgentTimelineItem(items, {
      id: `tool-${event.tool_call.id}`,
      kind: 'tool',
      title: getToolTitle(event.tool_call),
      content: getToolContent(event.tool_call),
      order,
      status: getToolStatus(event.tool_call.status),
      timestamp: getToolTimestamp(event.tool_call) || now,
    });
  }

  if (event.event === 'agent.evidence.created') {
    if (!event.evidence?.id) {
      return items;
    }

    return upsertAgentTimelineItem(items, {
      id: `evidence-${event.evidence.id}`,
      kind: 'evidence',
      title: `生成证据 ${event.evidence.resource_kind || event.evidence.source_kind || '-'}`,
      content: normalizeText(event.evidence.summary),
      meta: buildMetaList([
        event.evidence.namespace ? `ns/${event.evidence.namespace}` : undefined,
        event.evidence.name,
      ]),
      order,
      status: 'completed',
      timestamp: toTimestamp(event.evidence.collected_at) || now,
    });
  }

  if (event.event === 'agent.answer.delta') {
    return upsertAgentTimelineItem(items, {
      id: 'answer',
      kind: 'answer',
      title: '生成最终回答',
      content: normalizeText(options.answerContent),
      order,
      status: 'running',
      timestamp: now,
    });
  }

  if (event.event === 'agent.run.completed') {
    const answer =
      normalizeText(options.answerContent) || normalizeText(event.run?.summary);
    const settledItems = settleRunningTimelineItems(items, 'completed');
    const nextItems = answer
      ? upsertAgentTimelineItem(settledItems, {
          id: 'answer',
          kind: 'answer',
          title: '输出最终回答',
          content: answer,
          order,
          status: 'completed',
          timestamp: toTimestamp(event.run?.completed_at) || now,
        })
      : settledItems;

    return upsertAgentTimelineItem(nextItems, {
      id: 'run-completed',
      kind: 'run',
      title: 'Run 完成',
      order: getNextAgentTimelineOrder(nextItems),
      status: 'completed',
      timestamp: toTimestamp(event.run?.completed_at) || now,
    });
  }

  if (event.event === 'agent.run.failed') {
    const settledItems = settleRunningTimelineItems(items, 'failed');
    const answer =
      normalizeText(options.answerContent) || normalizeText(event.run?.summary);
    const nextItems = answer
      ? upsertAgentTimelineItem(settledItems, {
          id: 'answer',
          kind: 'answer',
          title: '最终回答未完成',
          content: answer,
          order,
          status: 'failed',
          timestamp: toTimestamp(event.run?.completed_at) || now,
        })
      : settledItems;

    return upsertAgentTimelineItem(nextItems, {
      id: 'error',
      kind: 'error',
      title: '执行失败',
      content: getAgentDisplayErrorMessage(
        normalizeText(event.error_message) ||
          normalizeText(event.run?.error_message),
      ),
      order,
      status: 'failed',
      timestamp: toTimestamp(event.run?.completed_at) || now,
    });
  }

  return items;
};
