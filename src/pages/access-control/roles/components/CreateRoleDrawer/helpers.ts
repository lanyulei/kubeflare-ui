import { stringify } from 'yaml';
import type {
  CreateRoleFormValues,
  CreateRoleType,
  LabelSelectorExpressionFormValue,
  MetadataItem,
  PolicyRuleFormValue,
} from './types';

const RBAC_API_VERSION = 'rbac.authorization.k8s.io/v1';
const ROLE_NAME_PATTERN =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

const normalizeText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const createMetadataItem = (): MetadataItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  keyName: '',
  value: '',
});

const normalizeStringList = (values?: string[]) =>
  (values || []).map((value) => value.trim()).filter(Boolean);

const metadataItemsToRecord = (items?: MetadataItem[]) => {
  const entries = (items || [])
    .map((item) => [item.keyName.trim(), item.value.trim()] as const)
    .filter(([key]) => key);

  return entries.length ? Object.fromEntries(entries) : undefined;
};

const normalizePolicyRule = (rule: PolicyRuleFormValue) => {
  const verbs = normalizeStringList(rule.verbs);

  if (rule.mode === 'nonResource') {
    return {
      nonResourceURLs: normalizeStringList(rule.nonResourceURLs),
      verbs,
    };
  }

  const resourceNames = normalizeStringList(rule.resourceNames);
  return {
    apiGroups: normalizeStringList(rule.apiGroups),
    resources: normalizeStringList(rule.resources),
    verbs,
    ...(resourceNames.length ? { resourceNames } : {}),
  };
};

const normalizeSelectorExpressions = (
  expressions?: LabelSelectorExpressionFormValue[],
) =>
  (expressions || [])
    .map((expression) => {
      const key = normalizeText(expression.key);
      const operator = expression.operator;
      const values = normalizeStringList(expression.values);

      if (!key || !operator) {
        return undefined;
      }

      return {
        key,
        operator,
        ...(operator === 'In' || operator === 'NotIn' ? { values } : {}),
      };
    })
    .filter((item) => Boolean(item));

const buildAggregationRule = (values: CreateRoleFormValues) => {
  if (values.type !== 'ClusterRole' || !values.aggregationEnabled) {
    return undefined;
  }

  const matchLabels = metadataItemsToRecord(values.aggregationLabels);
  const matchExpressions = normalizeSelectorExpressions(
    values.aggregationExpressions,
  );
  const selector =
    matchLabels || matchExpressions.length
      ? {
          ...(matchLabels ? { matchLabels } : {}),
          ...(matchExpressions.length ? { matchExpressions } : {}),
        }
      : undefined;

  return selector ? { clusterRoleSelectors: [selector] } : undefined;
};

const buildCreateRoleManifest = (values: CreateRoleFormValues) => {
  const type = values.type || 'Role';
  const labels = metadataItemsToRecord(values.labels);
  const annotations = metadataItemsToRecord(values.annotations);
  const namespace =
    type === 'Role' ? normalizeText(values.namespace) : undefined;
  const aggregationRule = buildAggregationRule(values);

  return {
    apiVersion: RBAC_API_VERSION,
    kind: type,
    metadata: {
      name: normalizeText(values.name),
      ...(namespace ? { namespace } : {}),
      ...(labels ? { labels } : {}),
      ...(annotations ? { annotations } : {}),
    },
    ...(aggregationRule ? { aggregationRule } : {}),
    rules: (values.rules || []).map(normalizePolicyRule),
  };
};

const buildCreateRoleYaml = (values: CreateRoleFormValues) =>
  stringify(buildCreateRoleManifest(values), { indent: 2 });

const getInitialCreateRoleValues = (
  type: CreateRoleType = 'Role',
  namespace?: string,
): CreateRoleFormValues => ({
  type,
  name: '',
  namespace,
  labels: [],
  annotations: [],
  rules: [
    {
      mode: 'resource',
      apiGroups: [''],
      resources: ['pods'],
      verbs: ['get', 'list', 'watch'],
      resourceNames: [],
      nonResourceURLs: [],
    },
  ],
  aggregationEnabled: false,
  aggregationLabels: [],
  aggregationExpressions: [],
});

const getCreateRoleStepFields = (
  step: number,
): (keyof CreateRoleFormValues)[] => {
  if (step === 0) {
    return ['type', 'name', 'namespace'];
  }
  if (step === 1) {
    return ['rules'];
  }
  return ['labels', 'annotations', 'aggregationEnabled'];
};

const hasMetadataContent = (items?: MetadataItem[]) =>
  (items || []).some((item) => item.keyName.trim());

const hasAdvancedContent = (values: CreateRoleFormValues) =>
  hasMetadataContent(values.labels) ||
  hasMetadataContent(values.annotations) ||
  Boolean(
    values.type === 'ClusterRole' &&
      values.aggregationEnabled &&
      (hasMetadataContent(values.aggregationLabels) ||
        (values.aggregationExpressions || []).some((item) => item.key?.trim())),
  );

const hasRulesContent = (values: CreateRoleFormValues) =>
  (values.rules || []).some(
    (rule) =>
      normalizeStringList(rule.verbs).length > 0 &&
      (normalizeStringList(rule.resources).length > 0 ||
        normalizeStringList(rule.nonResourceURLs).length > 0),
  );

export {
  buildCreateRoleManifest,
  buildCreateRoleYaml,
  createMetadataItem,
  getCreateRoleStepFields,
  getInitialCreateRoleValues,
  hasAdvancedContent,
  hasRulesContent,
  normalizeStringList,
  RBAC_API_VERSION,
  ROLE_NAME_PATTERN,
};
