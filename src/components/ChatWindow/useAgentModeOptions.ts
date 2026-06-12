import { useEffect, useMemo, useState } from 'react';
import { getAgentList } from '@/services/kubeflare/agent';
import { getAgentTypeLabel } from '@/utils/agent';

export type AgentModeOption = {
  disabled?: boolean;
  label: string;
  title?: string;
  value: API.AgentType;
};

const BASE_AGENT_MODE_OPTIONS: AgentModeOption[] = [
  { label: getAgentTypeLabel('auto'), value: 'auto' },
  { label: getAgentTypeLabel('assistant'), value: 'assistant' },
];

const FALLBACK_AGENT_MODE_OPTIONS: AgentModeOption[] = [
  ...BASE_AGENT_MODE_OPTIONS,
  { label: getAgentTypeLabel('diagnostic'), value: 'diagnostic' },
];

export const useAgentModeOptions = () => {
  const [agents, setAgents] = useState<API.AgentDefinition[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadAgents = async () => {
      try {
        const res = await getAgentList({ skipErrorHandler: true });
        if (!mounted) {
          return;
        }
        setAgents(res.data?.items || []);
      } catch (_error) {
        if (mounted) {
          setAgents([]);
        }
      }
    };

    void loadAgents();

    return () => {
      mounted = false;
    };
  }, []);

  return useMemo<AgentModeOption[]>(() => {
    if (agents.length === 0) {
      return FALLBACK_AGENT_MODE_OPTIONS;
    }

    const options = [...BASE_AGENT_MODE_OPTIONS];
    const existingValues = new Set(options.map((option) => option.value));

    agents.forEach((agent) => {
      if (existingValues.has(agent.type)) {
        return;
      }

      options.push({
        disabled: !agent.available,
        label: agent.name || getAgentTypeLabel(agent.type),
        title: agent.description,
        value: agent.type,
      });
      existingValues.add(agent.type);
    });

    return options;
  }, [agents]);
};
