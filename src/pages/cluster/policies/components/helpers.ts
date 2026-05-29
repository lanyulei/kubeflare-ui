import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

export const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

export type WorkloadTargetKind = 'Deployment' | 'StatefulSet' | 'DaemonSet';
export type ScalableWorkloadTargetKind = 'Deployment' | 'StatefulSet';

export type HorizontalPodAutoscalerFormValues = {
  name?: string;
  namespace?: string;
  targetKind?: ScalableWorkloadTargetKind;
  targetName?: string;
  minReplicas?: number;
  maxReplicas?: number;
  cpuEnabled?: boolean;
  cpuAverageUtilization?: number;
  memoryEnabled?: boolean;
  memoryAverageUtilization?: number;
};

export type VerticalPodAutoscalerFormValues = {
  name?: string;
  namespace?: string;
  targetKind?: ScalableWorkloadTargetKind;
  targetName?: string;
  updateMode?: 'Off' | 'Initial' | 'Recreate' | 'Auto';
  controlledResources?: ('cpu' | 'memory')[];
};

export type PodDisruptionBudgetFormValues = {
  name?: string;
  namespace?: string;
  targetKind?: WorkloadTargetKind;
  targetName?: string;
  selector?: Record<string, string>;
  mode?: 'minAvailable' | 'maxUnavailable';
  value?: number;
};

export type NetworkPolicyFormValues = {
  name?: string;
  namespace?: string;
  mode?: 'allowAll' | 'sameNamespace' | 'custom';
  direction?: 'Ingress' | 'Egress' | 'Both';
  podSelectors?: KeyValueEditorItem[];
  peerNamespace?: string;
  peerSelectors?: KeyValueEditorItem[];
  ports?: KeyValueEditorItem[];
};

const targetApiVersions: Record<WorkloadTargetKind, string> = {
  Deployment: 'apps/v1',
  StatefulSet: 'apps/v1',
  DaemonSet: 'apps/v1',
};

export const createKeyValueItem = (
  keyName = '',
  value = '',
): KeyValueEditorItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  keyName,
  value,
});

export const normalizeName = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

export const toKeyValueItems = (record?: Record<string, string>) => {
  const entries = Object.entries(record || {});

  return entries.length > 0
    ? entries.map(([keyName, value]) => createKeyValueItem(keyName, value))
    : [createKeyValueItem()];
};

export const toRecord = (items?: KeyValueEditorItem[]) => {
  const record: Record<string, string> = {};

  (items || []).forEach((item) => {
    const keyName = item.keyName.trim();
    const value = item.value.trim();

    if (keyName && value) {
      record[keyName] = value;
    }
  });

  return record;
};

export const getRecordEntries = (record?: Record<string, string>) =>
  Object.entries(record || {}).map(([key, value]) => `${key}=${value}`);

export const formatSelector = (record?: Record<string, string>) =>
  getRecordEntries(record).join('、') || '未设置';

export const getTargetApiVersion = (kind?: WorkloadTargetKind) =>
  kind ? targetApiVersions[kind] : 'apps/v1';

export const getInitialHorizontalPodAutoscalerValues = (
  namespace?: string,
): HorizontalPodAutoscalerFormValues => ({
  namespace,
  targetKind: 'Deployment',
  minReplicas: 1,
  maxReplicas: 5,
  cpuEnabled: true,
  cpuAverageUtilization: 70,
  memoryEnabled: false,
  memoryAverageUtilization: 80,
});

export const getInitialVerticalPodAutoscalerValues = (
  namespace?: string,
): VerticalPodAutoscalerFormValues => ({
  namespace,
  targetKind: 'Deployment',
  updateMode: 'Off',
  controlledResources: ['cpu', 'memory'],
});

export const getInitialPodDisruptionBudgetValues = (
  namespace?: string,
): PodDisruptionBudgetFormValues => ({
  namespace,
  targetKind: 'Deployment',
  mode: 'minAvailable',
  value: 1,
});

export const getInitialNetworkPolicyValues = (
  namespace?: string,
): NetworkPolicyFormValues => ({
  namespace,
  mode: 'sameNamespace',
  direction: 'Ingress',
  podSelectors: [createKeyValueItem()],
  peerSelectors: [createKeyValueItem()],
  ports: [createKeyValueItem()],
});

export const buildHorizontalPodAutoscalerManifest = (
  values: HorizontalPodAutoscalerFormValues,
) => {
  const metrics = [];

  if (values.cpuEnabled) {
    metrics.push({
      type: 'Resource',
      resource: {
        name: 'cpu',
        target: {
          type: 'Utilization',
          averageUtilization: values.cpuAverageUtilization || 70,
        },
      },
    });
  }

  if (values.memoryEnabled) {
    metrics.push({
      type: 'Resource',
      resource: {
        name: 'memory',
        target: {
          type: 'Utilization',
          averageUtilization: values.memoryAverageUtilization || 80,
        },
      },
    });
  }

  return {
    apiVersion: 'autoscaling/v2',
    kind: 'HorizontalPodAutoscaler',
    metadata: {
      name: normalizeName(values.name),
      namespace: normalizeName(values.namespace),
    },
    spec: {
      scaleTargetRef: {
        apiVersion: getTargetApiVersion(values.targetKind),
        kind: values.targetKind,
        name: normalizeName(values.targetName),
      },
      minReplicas: values.minReplicas || 1,
      maxReplicas: values.maxReplicas || 5,
      metrics,
    },
  };
};

export const buildVerticalPodAutoscalerManifest = (
  values: VerticalPodAutoscalerFormValues,
) => ({
  apiVersion: 'autoscaling.k8s.io/v1',
  kind: 'VerticalPodAutoscaler',
  metadata: {
    name: normalizeName(values.name),
    namespace: normalizeName(values.namespace),
  },
  spec: {
    targetRef: {
      apiVersion: getTargetApiVersion(values.targetKind),
      kind: values.targetKind,
      name: normalizeName(values.targetName),
    },
    updatePolicy: {
      updateMode: values.updateMode || 'Off',
    },
    resourcePolicy: {
      containerPolicies: [
        {
          containerName: '*',
          controlledResources: values.controlledResources?.length
            ? values.controlledResources
            : ['cpu', 'memory'],
        },
      ],
    },
  },
});

export const buildPodDisruptionBudgetManifest = (
  values: PodDisruptionBudgetFormValues,
) => ({
  apiVersion: 'policy/v1',
  kind: 'PodDisruptionBudget',
  metadata: {
    name: normalizeName(values.name),
    namespace: normalizeName(values.namespace),
  },
  spec: {
    selector: {
      matchLabels: values.selector || {},
    },
    [values.mode || 'minAvailable']: values.value || 1,
  },
});

const buildNetworkPolicyPeer = (
  namespace?: string,
  selectors?: KeyValueEditorItem[],
) => {
  const podSelector = toRecord(selectors);
  const peer: Record<string, unknown> = {};

  if (namespace) {
    peer.namespaceSelector = {
      matchLabels: {
        'kubernetes.io/metadata.name': namespace,
      },
    };
  }
  if (Object.keys(podSelector).length > 0) {
    peer.podSelector = {
      matchLabels: podSelector,
    };
  }

  return peer;
};

const buildNetworkPolicyPorts = (ports?: KeyValueEditorItem[]) =>
  (ports || []).flatMap((item) => {
    const port = Number(item.keyName);
    const protocol = item.value.trim() || 'TCP';

    if (!Number.isFinite(port) || port <= 0) {
      return [];
    }

    return [
      {
        protocol,
        port,
      },
    ];
  });

const buildNetworkPolicyRule = (
  mode?: NetworkPolicyFormValues['mode'],
  direction?: 'Ingress' | 'Egress',
  values?: NetworkPolicyFormValues,
) => {
  if (mode === 'allowAll') {
    return {};
  }
  if (mode === 'sameNamespace') {
    return direction === 'Egress'
      ? {
          to: [{ podSelector: {} }],
        }
      : {
          from: [{ podSelector: {} }],
        };
  }

  const peer = buildNetworkPolicyPeer(
    values?.peerNamespace,
    values?.peerSelectors,
  );
  const ports = buildNetworkPolicyPorts(values?.ports);
  const rule: Record<string, unknown> = {};

  if (Object.keys(peer).length > 0) {
    rule[direction === 'Egress' ? 'to' : 'from'] = [peer];
  }
  if (ports.length > 0) {
    rule.ports = ports;
  }

  return rule;
};

export const buildNetworkPolicyManifest = (values: NetworkPolicyFormValues) => {
  const policyTypes =
    values.direction === 'Both'
      ? ['Ingress', 'Egress']
      : [values.direction || 'Ingress'];
  const spec: Record<string, unknown> = {
    podSelector: {
      matchLabels: toRecord(values.podSelectors),
    },
    policyTypes,
  };

  if (policyTypes.includes('Ingress')) {
    spec.ingress = [buildNetworkPolicyRule(values.mode, 'Ingress', values)];
  }
  if (policyTypes.includes('Egress')) {
    spec.egress = [buildNetworkPolicyRule(values.mode, 'Egress', values)];
  }

  return {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'NetworkPolicy',
    metadata: {
      name: normalizeName(values.name),
      namespace: normalizeName(values.namespace),
    },
    spec,
  };
};
