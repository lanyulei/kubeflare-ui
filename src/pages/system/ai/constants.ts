import {
  AGENT_TYPE_LABELS,
  TOOL_ORIGIN_LABELS,
  TOOL_SOURCE_LABELS,
} from '@/utils/agent';

export { AGENT_TYPE_LABELS, TOOL_ORIGIN_LABELS, TOOL_SOURCE_LABELS };

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
