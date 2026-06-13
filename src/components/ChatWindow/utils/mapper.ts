import { buildAgentRunHistoryTimeline } from '@/utils/agentTimeline';
import type {
  ChatAgentRun,
  ChatMessageItem,
  ChatMessageRole,
  ChatSession,
} from '../types';

export const toTimestamp = (value?: string) => {
  if (!value) {
    return Date.now();
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Date.now();
};

export const toChatRole = (role?: API.AiChatMessageRole): ChatMessageRole => {
  if (role === 'user' || role === 'system') {
    return role;
  }
  return 'assistant';
};

export const toChatMessage = (
  message: API.AiChatMessageItem,
): ChatMessageItem => ({
  agentRun: toChatAgentRun(message.metadata?.agent_run),
  completionTokens: message.completion_tokens,
  content: message.content || '',
  createdAt: toTimestamp(message.created_at),
  errorMessage: message.error_message,
  id: message.id,
  model: message.model,
  promptTokens: message.prompt_tokens,
  provider: message.provider,
  role: toChatRole(message.role),
  status: message.status,
  totalTokens: message.total_tokens,
});

const toChatAgentRun = (
  agentRun?: API.AiChatMessageAgentRunMetadata,
): ChatAgentRun | undefined => {
  if (!agentRun) {
    return undefined;
  }

  return {
    evidences: agentRun.evidences || [],
    errorMessage: agentRun.error_message || agentRun.run?.error_message,
    feedback: agentRun.feedback,
    route: agentRun.route,
    run: agentRun.run,
    status: agentRun.status || agentRun.run?.status,
    timeline: buildAgentRunHistoryTimeline({
      answerContent: agentRun.run?.summary,
      errorMessage: agentRun.error_message,
      evidences: agentRun.evidences || [],
      route: agentRun.route,
      run: agentRun.run,
      toolCalls: agentRun.tool_calls || [],
    }),
    toolCalls: agentRun.tool_calls || [],
  };
};

export const toChatSession = (
  session: API.AiChatSessionItem,
  messages: ChatMessageItem[] = [],
): ChatSession => ({
  createdAt: toTimestamp(session.created_at),
  id: session.id,
  messages,
  summary: session.summary,
  title: session.title || '新会话',
  updatedAt: toTimestamp(session.updated_at || session.created_at),
});

export const toChatSessionDetail = (
  detail: API.AiChatSessionDetail,
): ChatSession =>
  toChatSession(detail, (detail.messages || []).map(toChatMessage));

export const replaceSession = (
  sessions: ChatSession[],
  updatedSession: ChatSession,
) => {
  if (!sessions.some((session) => session.id === updatedSession.id)) {
    return [updatedSession, ...sessions];
  }

  return sessions.map((session) =>
    session.id === updatedSession.id ? updatedSession : session,
  );
};

export const upsertSessionToTop = (
  sessions: ChatSession[],
  updatedSession: ChatSession,
) => [
  updatedSession,
  ...sessions.filter((session) => session.id !== updatedSession.id),
];
