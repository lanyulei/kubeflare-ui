import { useEffect, useMemo, useState } from 'react';
import { getAgentList } from '@/services/kubeflare/agent';
import { getAgentTypeLabel, MANAGED_AGENT_TYPE_OPTIONS } from '@/utils/agent';

export type AgentSelectOption = {
  disabled?: boolean;
  label: string;
  title?: string;
  value: API.AgentType;
};

type UseAgentOptionsParams = {
  disableUnavailable?: boolean;
  includeAssistant?: boolean;
  includeAuto?: boolean;
};

let cachedAgents: API.AgentDefinition[] | undefined;
let loadingAgents: Promise<API.AgentDefinition[]> | undefined;

const loadAgents = async () => {
  if (cachedAgents) {
    return cachedAgents;
  }

  if (!loadingAgents) {
    loadingAgents = getAgentList({ skipErrorHandler: true })
      .then((res) => {
        cachedAgents = res.data?.items || [];
        return cachedAgents;
      })
      .catch(() => {
        return [];
      })
      .finally(() => {
        loadingAgents = undefined;
      });
  }

  return loadingAgents;
};

const getBaseOptions = ({
  includeAssistant,
  includeAuto,
}: UseAgentOptionsParams): AgentSelectOption[] => [
  ...(includeAuto
    ? [{ label: getAgentTypeLabel('auto'), value: 'auto' as API.AgentType }]
    : []),
  ...(includeAssistant
    ? [
        {
          label: getAgentTypeLabel('assistant'),
          value: 'assistant' as API.AgentType,
        },
      ]
    : []),
];

const toAgentOption = (
  agent: API.AgentDefinition,
  disableUnavailable?: boolean,
): AgentSelectOption => ({
  disabled: disableUnavailable ? !agent.available : undefined,
  label: agent.name || getAgentTypeLabel(agent.type),
  title: agent.description,
  value: agent.type,
});

const buildAgentOptions = (
  agents: API.AgentDefinition[],
  params: UseAgentOptionsParams,
) => {
  const options = getBaseOptions(params);
  const existing = new Set(options.map((option) => option.value));

  const pushOption = (option: AgentSelectOption) => {
    if (existing.has(option.value)) {
      return;
    }
    options.push(option);
    existing.add(option.value);
  };

  if (agents.length > 0) {
    agents.forEach((agent) => {
      if (agent.type === 'auto' && !params.includeAuto) {
        return;
      }
      if (agent.type === 'assistant' && !params.includeAssistant) {
        return;
      }
      pushOption(toAgentOption(agent, params.disableUnavailable));
    });
  } else {
    MANAGED_AGENT_TYPE_OPTIONS.forEach(pushOption);
  }

  return options;
};

export const useAgentOptions = (params: UseAgentOptionsParams = {}) => {
  const [agents, setAgents] = useState<API.AgentDefinition[]>(
    cachedAgents || [],
  );
  const [loading, setLoading] = useState(!cachedAgents);

  useEffect(() => {
    let mounted = true;

    setLoading(!cachedAgents);
    loadAgents()
      .then((items) => {
        if (mounted) {
          setAgents(items);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo(
    () => buildAgentOptions(agents, params),
    [
      agents,
      params.disableUnavailable,
      params.includeAssistant,
      params.includeAuto,
    ],
  );

  return {
    agents,
    loading,
    options,
  };
};
