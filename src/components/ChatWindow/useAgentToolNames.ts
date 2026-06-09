import { useEffect, useState } from 'react';
import { getAgentToolList } from '@/services/kubeflare/agent';

export type AgentToolNameMap = Record<string, string>;

let cachedToolNameMap: AgentToolNameMap | undefined;
let loadingPromise: Promise<AgentToolNameMap> | undefined;

const buildToolNameMap = (
  tools?: API.AgentToolDefinition[],
): AgentToolNameMap =>
  (tools || []).reduce<AgentToolNameMap>((map, tool) => {
    const id = tool.id?.trim();
    const name = tool.name?.trim();

    if (id && name) {
      map[id] = name;
    }

    return map;
  }, {});

const loadToolNameMap = async () => {
  if (cachedToolNameMap) {
    return cachedToolNameMap;
  }

  if (!loadingPromise) {
    loadingPromise = getAgentToolList({ skipErrorHandler: true })
      .then((res) => {
        cachedToolNameMap = buildToolNameMap(res.data?.items);
        return cachedToolNameMap;
      })
      .catch(() => {
        cachedToolNameMap = {};
        return cachedToolNameMap;
      });
  }

  return loadingPromise;
};

export const getAgentToolDisplayName = (
  toolID: string | undefined,
  toolNameMap: AgentToolNameMap,
) => {
  const normalizedToolID = toolID?.trim();
  if (!normalizedToolID) {
    return '-';
  }

  return toolNameMap[normalizedToolID] || normalizedToolID;
};

export const useAgentToolNames = (enabled: boolean) => {
  const [toolNameMap, setToolNameMap] = useState<AgentToolNameMap>(
    cachedToolNameMap || {},
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let ignored = false;

    loadToolNameMap().then((nextToolNameMap) => {
      if (!ignored) {
        setToolNameMap(nextToolNameMap);
      }
    });

    return () => {
      ignored = true;
    };
  }, [enabled]);

  return toolNameMap;
};
