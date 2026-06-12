export const AGENT_TYPE_LABELS: Record<string, string> = {
  assistant: '普通助手',
  auto: '自动选择',
  capacity: '容量分析助手',
  change_review: '变更影响助手',
  cost: '成本分析助手',
  diagnostic: '集群诊断助手',
  remediation: '修复建议助手',
  security: '安全分析助手',
};

export const AGENT_ROUTE_SOURCE_LABELS: Record<string, string> = {
  keyword: '关键词路由',
  llm: '智能路由',
  user: '手动指定',
};

export const TOOL_SOURCE_LABELS: Record<string, string> = {
  cluster: '集群',
  monitoring: '监控',
};

export const TOOL_ORIGIN_LABELS: Record<string, string> = {
  builtin: '内置',
  config: '配置',
  mcp: 'MCP',
};

export const getAgentTypeLabel = (agentType?: string) =>
  (agentType && AGENT_TYPE_LABELS[agentType]) || agentType || '-';

export const getAgentRouteSourceLabel = (source?: string) =>
  (source && AGENT_ROUTE_SOURCE_LABELS[source]) || source || '-';

export const normalizeAgentScope = (
  scope?: API.AgentScope,
): API.AgentScope => ({
  container: scope?.container?.trim() || undefined,
  namespace: scope?.namespace?.trim() || undefined,
  resource_kind: scope?.resource_kind?.trim() || undefined,
  resource_name: scope?.resource_name?.trim() || undefined,
});

export const hasAgentScope = (scope?: API.AgentScope) => {
  const normalizedScope = normalizeAgentScope(scope);

  return Boolean(
    normalizedScope.container ||
      normalizedScope.namespace ||
      normalizedScope.resource_kind ||
      normalizedScope.resource_name,
  );
};

export const getAgentScopeSummary = (scope?: API.AgentScope) => {
  const normalizedScope = normalizeAgentScope(scope);
  const resourceText =
    normalizedScope.resource_kind && normalizedScope.resource_name
      ? `${normalizedScope.resource_kind}/${normalizedScope.resource_name}`
      : normalizedScope.resource_kind || normalizedScope.resource_name;
  const parts = [
    normalizedScope.namespace ? `ns/${normalizedScope.namespace}` : undefined,
    resourceText,
    normalizedScope.container
      ? `container/${normalizedScope.container}`
      : undefined,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : '全局上下文';
};

export const buildAgentDiagnosePrompt = (scope?: API.AgentScope) => {
  const normalizedScope = normalizeAgentScope(scope);
  const summary = getAgentScopeSummary(normalizedScope);

  if (!hasAgentScope(normalizedScope)) {
    return '请诊断当前集群的健康状态，优先关注异常事件、节点、工作负载和关键资源风险。';
  }

  return `请诊断 ${summary} 的健康状态，结合事件、状态、关联资源和近期异常给出结论与处理建议。`;
};
