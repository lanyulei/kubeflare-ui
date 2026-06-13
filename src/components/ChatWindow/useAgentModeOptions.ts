import {
  type AgentSelectOption,
  useAgentOptions,
} from '@/hooks/useAgentOptions';

export type AgentModeOption = AgentSelectOption;

export const useAgentModeOptions = () => {
  const { options } = useAgentOptions({
    disableUnavailable: true,
    includeAssistant: true,
    includeAuto: true,
  });

  return options;
};
