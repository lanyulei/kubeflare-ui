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

export const MANAGED_AGENT_TYPE_OPTIONS: {
  label: string;
  value: API.AgentType;
}[] = [
  { label: AGENT_TYPE_LABELS.diagnostic, value: 'diagnostic' },
  { label: AGENT_TYPE_LABELS.security, value: 'security' },
  { label: AGENT_TYPE_LABELS.capacity, value: 'capacity' },
  { label: AGENT_TYPE_LABELS.change_review, value: 'change_review' },
  { label: AGENT_TYPE_LABELS.cost, value: 'cost' },
  { label: AGENT_TYPE_LABELS.remediation, value: 'remediation' },
];

export const TOOL_SOURCE_LABELS: Record<string, string> = {
  cluster: '集群',
  monitoring: '监控',
};

export const TOOL_ORIGIN_LABELS: Record<string, string> = {
  builtin: '内置',
  config: '配置',
  mcp: 'MCP',
};
