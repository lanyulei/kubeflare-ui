import {
  type AgentSelectOption,
  useAgentOptions,
} from '@/hooks/useAgentOptions';

export type AgentModeOption = AgentSelectOption;

const TEMP_HIDDEN_AGENT_MODE_TYPES = new Set<API.AgentType>([
  'capacity',
  'change_review',
  'cost',
  'remediation',
  'security',
]);

export const useAgentModeOptions = () => {
  const { options } = useAgentOptions({
    disableUnavailable: true,
    includeAssistant: true,
    includeAuto: true,
  });

  return options.filter(
    (option) => !TEMP_HIDDEN_AGENT_MODE_TYPES.has(option.value),
  );
};
