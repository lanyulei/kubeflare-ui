import { stringify } from 'yaml';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type {
  CreateNetworkPolicyFormValues,
  NetworkPolicyLabelSelectorValues,
  NetworkPolicyPeerItem,
  NetworkPolicyPeerType,
  NetworkPolicyPolicyType,
  NetworkPolicyPortItem,
  NetworkPolicyRuleItem,
  NetworkPolicySelectorExpressionItem,
  NetworkPolicySelectorOperator,
} from './types';

export const NETWORK_POLICY_API_VERSION = 'networking.k8s.io/v1';
export const NETWORK_POLICY_KIND = 'NetworkPolicy';
export const NETWORK_POLICY_RESOURCE_TYPE: API.ClusterResourceCreateType =
  'NetworkPolicy';
export const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const trimValue = (value?: string) => value?.trim() || '';

const getPortNumber = (value?: string) => {
  const portValue = trimValue(value);
  if (!/^\d+$/.test(portValue)) {
    return undefined;
  }
  const numberValue = Number(portValue);
  return Number.isInteger(numberValue) ? numberValue : undefined;
};

const getPortManifestValue = (value?: string) => {
  const portValue = trimValue(value);
  if (!portValue) {
    return undefined;
  }
  return /^\d+$/.test(portValue) ? Number(portValue) : portValue;
};

export const createKeyValueItem = (
  keyName = '',
  value = '',
): KeyValueEditorItem => ({
  id: createId(),
  keyName,
  value,
});

export const createSelectorExpressionItem = (
  values?: Partial<NetworkPolicySelectorExpressionItem>,
): NetworkPolicySelectorExpressionItem => ({
  id: values?.id || createId(),
  keyName: values?.keyName,
  operator: values?.operator || 'In',
  values: values?.values || [],
});

export const createLabelSelectorValues = (
  values?: Partial<NetworkPolicyLabelSelectorValues>,
): NetworkPolicyLabelSelectorValues => ({
  matchExpressions: values?.matchExpressions || [],
  matchLabels:
    values?.matchLabels && values.matchLabels.length > 0
      ? values.matchLabels
      : [createKeyValueItem()],
});

export const createNetworkPolicyPeerItem = (
  values?: Partial<NetworkPolicyPeerItem>,
): NetworkPolicyPeerItem => {
  const type = values?.type || 'podSelector';

  return {
    id: values?.id || createId(),
    type,
    ipBlockCidr: values?.ipBlockCidr,
    ipBlockExcept: values?.ipBlockExcept,
    podSelector:
      values?.podSelector ||
      (type === 'podSelector' || type === 'podAndNamespaceSelector'
        ? createLabelSelectorValues()
        : undefined),
    namespaceSelector:
      values?.namespaceSelector ||
      (type === 'namespaceSelector' || type === 'podAndNamespaceSelector'
        ? createLabelSelectorValues()
        : undefined),
  };
};

export const createNetworkPolicyPortItem = (
  values?: Partial<NetworkPolicyPortItem>,
): NetworkPolicyPortItem => ({
  id: values?.id || createId(),
  endPort: values?.endPort,
  port: values?.port,
  protocol: values?.protocol || 'TCP',
});

export const createNetworkPolicyRuleItem = (
  values?: Partial<NetworkPolicyRuleItem>,
): NetworkPolicyRuleItem => ({
  id: values?.id || createId(),
  peers: values?.peers || [],
  ports: values?.ports || [],
});

export const getInitialCreateNetworkPolicyValues = (
  namespace?: string,
): CreateNetworkPolicyFormValues => ({
  annotations: [createKeyValueItem()],
  egress: [],
  ingress: [],
  labels: [createKeyValueItem()],
  name: undefined,
  namespace,
  podSelector: createLabelSelectorValues(),
  policyTypes: ['Ingress'],
});

export const getNetworkPolicyStepFields = (step: number) => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 1) {
    return ['podSelector', 'policyTypes'];
  }
  if (step === 2) {
    return ['ingress'];
  }
  if (step === 3) {
    return ['egress'];
  }
  return ['labels', 'annotations'];
};

export const selectorOperatorNeedsValues = (
  operator?: NetworkPolicySelectorOperator,
) => operator === 'In' || operator === 'NotIn';

export const toRecord = (items?: KeyValueEditorItem[]) =>
  (items || []).reduce<Record<string, string>>((record, item) => {
    const keyName = trimValue(item.keyName);
    if (keyName) {
      record[keyName] = trimValue(item.value);
    }
    return record;
  }, {});

const getCleanExpressionValues = (values?: string[]) =>
  Array.from(
    new Set((values || []).map((item) => trimValue(item)).filter(Boolean)),
  );

const buildLabelSelector = (selector?: NetworkPolicyLabelSelectorValues) => {
  const matchLabels = toRecord(selector?.matchLabels);
  const matchExpressions = (selector?.matchExpressions || [])
    .map((expression) => {
      const keyName = trimValue(expression.keyName);
      if (!keyName) {
        return undefined;
      }

      const requirement: Record<string, unknown> = {
        key: keyName,
        operator: expression.operator,
      };
      const values = getCleanExpressionValues(expression.values);

      if (selectorOperatorNeedsValues(expression.operator)) {
        requirement.values = values;
      }

      return requirement;
    })
    .filter(Boolean);

  return {
    ...(Object.keys(matchLabels).length > 0 ? { matchLabels } : {}),
    ...(matchExpressions.length > 0 ? { matchExpressions } : {}),
  };
};

const buildNetworkPolicyPeer = (peer: NetworkPolicyPeerItem) => {
  if (peer.type === 'ipBlock') {
    const cidr = trimValue(peer.ipBlockCidr);
    const except = getCleanExpressionValues(peer.ipBlockExcept);

    if (!cidr) {
      return undefined;
    }

    return {
      ipBlock: {
        cidr,
        ...(except.length > 0 ? { except } : {}),
      },
    };
  }

  if (peer.type === 'namespaceSelector') {
    return {
      namespaceSelector: buildLabelSelector(peer.namespaceSelector),
    };
  }

  if (peer.type === 'podAndNamespaceSelector') {
    return {
      namespaceSelector: buildLabelSelector(peer.namespaceSelector),
      podSelector: buildLabelSelector(peer.podSelector),
    };
  }

  return {
    podSelector: buildLabelSelector(peer.podSelector),
  };
};

const buildNetworkPolicyPorts = (ports?: NetworkPolicyPortItem[]) =>
  (ports || []).map((port) => {
    const nextPort: Record<string, unknown> = {
      protocol: port.protocol || 'TCP',
    };
    const portValue = getPortManifestValue(port.port);

    if (portValue !== undefined) {
      nextPort.port = portValue;
    }
    if (port.endPort !== undefined) {
      nextPort.endPort = port.endPort;
    }

    return nextPort;
  });

const buildNetworkPolicyRules = (
  rules: NetworkPolicyRuleItem[] | undefined,
  peerFieldName: 'from' | 'to',
) =>
  (rules || []).map((rule) => {
    const peers = (rule.peers || [])
      .map(buildNetworkPolicyPeer)
      .filter(Boolean);
    const ports = buildNetworkPolicyPorts(rule.ports);
    const nextRule: Record<string, unknown> = {};

    if (ports.length > 0) {
      nextRule.ports = ports;
    }
    if (peers.length > 0) {
      nextRule[peerFieldName] = peers;
    }

    return nextRule;
  });

const getSelectedPolicyTypes = (values: CreateNetworkPolicyFormValues) => {
  const selectedTypes = values.policyTypes || [];

  return (['Ingress', 'Egress'] as NetworkPolicyPolicyType[]).filter((type) =>
    selectedTypes.includes(type),
  );
};

export const buildCreateNetworkPolicyManifest = (
  values: CreateNetworkPolicyFormValues,
) => {
  const labels = toRecord(values.labels);
  const annotations = toRecord(values.annotations);
  const policyTypes = getSelectedPolicyTypes(values);
  const spec: Record<string, unknown> = {
    podSelector: buildLabelSelector(values.podSelector),
    policyTypes,
  };

  if (policyTypes.includes('Ingress')) {
    spec.ingress = buildNetworkPolicyRules(values.ingress, 'from');
  }
  if (policyTypes.includes('Egress')) {
    spec.egress = buildNetworkPolicyRules(values.egress, 'to');
  }

  return {
    apiVersion: NETWORK_POLICY_API_VERSION,
    kind: NETWORK_POLICY_KIND,
    metadata: {
      name: values.name,
      namespace: values.namespace,
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
      ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    },
    spec,
  };
};

export const buildCreateNetworkPolicyYaml = (
  values: CreateNetworkPolicyFormValues,
) => stringify(buildCreateNetworkPolicyManifest(values), { indent: 2 });

export const hasKeyValueContent = (items?: KeyValueEditorItem[]) =>
  (items || []).some((item) => trimValue(item.keyName));

export const hasSelectorContent = (
  selector?: NetworkPolicyLabelSelectorValues,
) =>
  hasKeyValueContent(selector?.matchLabels) ||
  (selector?.matchExpressions || []).some((item) => trimValue(item.keyName));

export const hasRulesContent = (rules?: NetworkPolicyRuleItem[]) =>
  (rules || []).length > 0;

export const hasMetadataContent = (values: CreateNetworkPolicyFormValues) =>
  hasKeyValueContent(values.labels) || hasKeyValueContent(values.annotations);

const validateSelectorExpressions = (
  selector: NetworkPolicyLabelSelectorValues | undefined,
  label: string,
) => {
  for (const expression of selector?.matchExpressions || []) {
    const keyName = trimValue(expression.keyName);
    const values = getCleanExpressionValues(expression.values);

    if (!keyName) {
      return `${label}的表达式必须填写键`;
    }
    if (
      selectorOperatorNeedsValues(expression.operator) &&
      values.length === 0
    ) {
      return `${label}的 ${expression.operator} 表达式必须至少填写一个值`;
    }
  }

  return undefined;
};

const validatePeer = (
  peer: NetworkPolicyPeerItem,
  peerLabel: string,
  ruleIndex: number,
) => {
  if (peer.type === 'ipBlock' && !trimValue(peer.ipBlockCidr)) {
    return `${peerLabel} ${ruleIndex + 1} 的 IP 网段必须填写 CIDR`;
  }

  const podSelectorMessage =
    peer.type === 'podSelector' || peer.type === 'podAndNamespaceSelector'
      ? validateSelectorExpressions(
          peer.podSelector,
          `${peerLabel} ${ruleIndex + 1} 的 Pod 选择器`,
        )
      : undefined;
  if (podSelectorMessage) {
    return podSelectorMessage;
  }

  const namespaceSelectorMessage =
    peer.type === 'namespaceSelector' || peer.type === 'podAndNamespaceSelector'
      ? validateSelectorExpressions(
          peer.namespaceSelector,
          `${peerLabel} ${ruleIndex + 1} 的命名空间选择器`,
        )
      : undefined;
  if (namespaceSelectorMessage) {
    return namespaceSelectorMessage;
  }

  return undefined;
};

const validatePort = (
  port: NetworkPolicyPortItem,
  ruleLabel: string,
  ruleIndex: number,
) => {
  if (port.endPort === undefined) {
    return undefined;
  }

  const portNumber = getPortNumber(port.port);
  if (!portNumber) {
    return `${ruleLabel} ${ruleIndex + 1} 设置结束端口时，端口必须填写数字`;
  }
  if (port.endPort < portNumber) {
    return `${ruleLabel} ${ruleIndex + 1} 的结束端口不能小于起始端口`;
  }

  return undefined;
};

const validateRules = (
  rules: NetworkPolicyRuleItem[] | undefined,
  ruleLabel: string,
  peerLabel: string,
) => {
  for (const [ruleIndex, rule] of (rules || []).entries()) {
    for (const peer of rule.peers || []) {
      const peerMessage = validatePeer(peer, peerLabel, ruleIndex);
      if (peerMessage) {
        return peerMessage;
      }
    }

    for (const port of rule.ports || []) {
      const portMessage = validatePort(port, ruleLabel, ruleIndex);
      if (portMessage) {
        return portMessage;
      }
    }
  }

  return undefined;
};

export const validateNetworkPolicyStep = (
  values: CreateNetworkPolicyFormValues,
  step: number,
) => {
  if (step === 1) {
    if (!values.policyTypes?.length) {
      return '请至少选择一种策略类型';
    }
    return validateSelectorExpressions(values.podSelector, 'Pod 选择器');
  }
  if (step === 2 && values.policyTypes?.includes('Ingress')) {
    return validateRules(values.ingress, '入站规则', '来源');
  }
  if (step === 3 && values.policyTypes?.includes('Egress')) {
    return validateRules(values.egress, '出站规则', '目标');
  }

  return undefined;
};

export const validateNetworkPolicyFormValues = (
  values: CreateNetworkPolicyFormValues,
) => {
  for (const step of [1, 2, 3]) {
    const message = validateNetworkPolicyStep(values, step);
    if (message) {
      return message;
    }
  }

  return undefined;
};

export const getDefaultPeerForType = (
  type: NetworkPolicyPeerType,
  peer?: NetworkPolicyPeerItem,
) =>
  createNetworkPolicyPeerItem({
    id: peer?.id,
    type,
    ipBlockCidr: peer?.ipBlockCidr,
    ipBlockExcept: peer?.ipBlockExcept,
    namespaceSelector: peer?.namespaceSelector,
    podSelector: peer?.podSelector,
  });
