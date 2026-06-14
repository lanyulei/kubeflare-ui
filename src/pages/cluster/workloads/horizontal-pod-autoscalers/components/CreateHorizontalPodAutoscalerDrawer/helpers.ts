import { stringify } from 'yaml';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type {
  CreateHorizontalPodAutoscalerFormValues,
  HpaMetricItem,
  HpaMetricSelectorRequirementItem,
  HpaMetricTargetType,
  HpaMetricType,
  HpaScalingPolicyItem,
} from './types';

export const HPA_API_VERSION = 'autoscaling/v2';
export const HPA_KIND = 'HorizontalPodAutoscaler';
export const HPA_RESOURCE_TYPE = 'HorizontalPodAutoscaler';
export const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createKeyValueItem = (
  keyName = '',
  value = '',
): KeyValueEditorItem => ({
  id: createId(),
  keyName,
  value,
});

export const createMetricSelectorRequirementItem = (
  values?: Partial<HpaMetricSelectorRequirementItem>,
): HpaMetricSelectorRequirementItem => ({
  id: createId(),
  keyName: values?.keyName,
  operator: values?.operator || 'In',
  values: values?.values,
});

export const createHpaMetricItem = (
  values?: Partial<HpaMetricItem>,
): HpaMetricItem => {
  const type = values?.type || 'Resource';
  const targetType = values?.targetType || getDefaultTargetType(type);

  return {
    id: createId(),
    type,
    resourceName:
      values?.resourceName ||
      (type === 'Resource' || type === 'ContainerResource' ? 'cpu' : undefined),
    container: values?.container,
    metricName: values?.metricName,
    describedObjectApiVersion: values?.describedObjectApiVersion || 'apps/v1',
    describedObjectKind: values?.describedObjectKind || 'Deployment',
    describedObjectName: values?.describedObjectName,
    targetType,
    averageUtilization:
      values?.averageUtilization ??
      (targetType === 'Utilization' ? 70 : undefined),
    averageValue: values?.averageValue,
    value: values?.value,
    selectorLabels: values?.selectorLabels || [createKeyValueItem()],
    selectorExpressions: values?.selectorExpressions || [],
  };
};

export const createHpaScalingPolicyItem = (
  values?: Partial<HpaScalingPolicyItem>,
): HpaScalingPolicyItem => ({
  id: createId(),
  type: values?.type || 'Percent',
  value: values?.value ?? 100,
  periodSeconds: values?.periodSeconds ?? 60,
});

export const getDefaultTargetType = (
  metricType?: HpaMetricType,
): HpaMetricTargetType => {
  if (metricType === 'Resource' || metricType === 'ContainerResource') {
    return 'Utilization';
  }
  if (metricType === 'Pods') {
    return 'AverageValue';
  }
  return 'Value';
};

export const getInitialCreateHpaValues = (
  namespace?: string,
): CreateHorizontalPodAutoscalerFormValues => ({
  name: undefined,
  namespace,
  targetApiVersion: 'apps/v1',
  targetKind: 'Deployment',
  targetName: undefined,
  minReplicas: 1,
  maxReplicas: 5,
  metrics: [createHpaMetricItem()],
  enableScaleUpBehavior: false,
  scaleUpSelectPolicy: 'Max',
  scaleUpStabilizationWindowSeconds: 0,
  scaleUpTolerance: undefined,
  scaleUpPolicies: [createHpaScalingPolicyItem()],
  enableScaleDownBehavior: false,
  scaleDownSelectPolicy: 'Max',
  scaleDownStabilizationWindowSeconds: 300,
  scaleDownTolerance: undefined,
  scaleDownPolicies: [createHpaScalingPolicyItem()],
  labels: [createKeyValueItem()],
  annotations: [createKeyValueItem()],
});

export const getHpaStepFields = (step: number) => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 1) {
    return ['targetApiVersion', 'targetKind', 'targetName'];
  }
  if (step === 2) {
    return ['minReplicas', 'maxReplicas', 'metrics'];
  }
  return [
    'enableScaleUpBehavior',
    'scaleUpSelectPolicy',
    'scaleUpStabilizationWindowSeconds',
    'scaleUpTolerance',
    'scaleUpPolicies',
    'enableScaleDownBehavior',
    'scaleDownSelectPolicy',
    'scaleDownStabilizationWindowSeconds',
    'scaleDownTolerance',
    'scaleDownPolicies',
    'labels',
    'annotations',
  ];
};

export const getTargetApiVersionByKind = (kind?: string) =>
  kind === 'ReplicationController' ? 'v1' : 'apps/v1';

const normalizeText = (value?: string) => value?.trim() || undefined;

const toRecord = (items?: KeyValueEditorItem[]) =>
  (items || []).reduce<Record<string, string>>((record, item) => {
    const keyName = item.keyName.trim();
    if (keyName) {
      record[keyName] = item.value.trim();
    }
    return record;
  }, {});

const splitValues = (value?: string) =>
  (value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const buildSelector = (
  labels?: KeyValueEditorItem[],
  expressions?: HpaMetricSelectorRequirementItem[],
) => {
  const matchLabels = toRecord(labels);
  const matchExpressions = (expressions || [])
    .filter((item) => item.keyName?.trim())
    .map((item) => {
      const operator = item.operator || 'In';
      const requirement: Record<string, unknown> = {
        key: item.keyName?.trim(),
        operator,
      };

      if (operator === 'In' || operator === 'NotIn') {
        requirement.values = splitValues(item.values);
      }

      return requirement;
    });
  const selector: Record<string, unknown> = {};

  if (Object.keys(matchLabels).length > 0) {
    selector.matchLabels = matchLabels;
  }
  if (matchExpressions.length > 0) {
    selector.matchExpressions = matchExpressions;
  }

  return Object.keys(selector).length > 0 ? selector : undefined;
};

const buildMetricIdentifier = (metric?: HpaMetricItem) => {
  const metricName = normalizeText(metric?.metricName);
  const selector = buildSelector(
    metric?.selectorLabels,
    metric?.selectorExpressions,
  );

  if (!metricName) {
    return undefined;
  }

  return {
    name: metricName,
    ...(selector ? { selector } : {}),
  };
};

const buildMetricTarget = (metric?: HpaMetricItem) => {
  const targetType = metric?.targetType || getDefaultTargetType(metric?.type);
  const target: Record<string, unknown> = {
    type: targetType,
  };

  if (targetType === 'Utilization') {
    target.averageUtilization = metric?.averageUtilization;
  }
  if (targetType === 'AverageValue') {
    target.averageValue = normalizeText(metric?.averageValue);
  }
  if (targetType === 'Value') {
    target.value = normalizeText(metric?.value);
  }

  return target;
};

const buildMetricSpec = (metric: HpaMetricItem) => {
  const target = buildMetricTarget(metric);

  if (metric.type === 'Resource') {
    return {
      type: metric.type,
      resource: {
        name: normalizeText(metric.resourceName),
        target,
      },
    };
  }
  if (metric.type === 'ContainerResource') {
    return {
      type: metric.type,
      containerResource: {
        container: normalizeText(metric.container),
        name: normalizeText(metric.resourceName),
        target,
      },
    };
  }
  if (metric.type === 'Pods') {
    return {
      type: metric.type,
      pods: {
        metric: buildMetricIdentifier(metric),
        target,
      },
    };
  }
  if (metric.type === 'Object') {
    return {
      type: metric.type,
      object: {
        describedObject: {
          apiVersion: normalizeText(metric.describedObjectApiVersion),
          kind: normalizeText(metric.describedObjectKind),
          name: normalizeText(metric.describedObjectName),
        },
        metric: buildMetricIdentifier(metric),
        target,
      },
    };
  }

  return {
    type: metric.type,
    external: {
      metric: buildMetricIdentifier(metric),
      target,
    },
  };
};

const buildScalingRules = (
  enabled?: boolean,
  values?: {
    policies?: HpaScalingPolicyItem[];
    selectPolicy?: string;
    stabilizationWindowSeconds?: number;
    tolerance?: string;
  },
) => {
  if (!enabled) {
    return undefined;
  }

  const policies = (values?.policies || [])
    .filter(
      (item) =>
        item.type &&
        typeof item.value === 'number' &&
        typeof item.periodSeconds === 'number',
    )
    .map((item) => ({
      type: item.type,
      value: item.value,
      periodSeconds: item.periodSeconds,
    }));
  const rules: Record<string, unknown> = {};
  const tolerance = normalizeText(values?.tolerance);

  if (policies.length > 0) {
    rules.policies = policies;
  }
  if (values?.selectPolicy) {
    rules.selectPolicy = values.selectPolicy;
  }
  if (typeof values?.stabilizationWindowSeconds === 'number') {
    rules.stabilizationWindowSeconds = values.stabilizationWindowSeconds;
  }
  if (tolerance) {
    rules.tolerance = tolerance;
  }

  return Object.keys(rules).length > 0 ? rules : undefined;
};

export const buildCreateHpaManifest = (
  values: CreateHorizontalPodAutoscalerFormValues,
) => {
  const labels = toRecord(values.labels);
  const annotations = toRecord(values.annotations);
  const metadata: Record<string, unknown> = {
    name: values.name,
    namespace: values.namespace,
  };
  const behavior: Record<string, unknown> = {};
  const scaleUp = buildScalingRules(values.enableScaleUpBehavior, {
    policies: values.scaleUpPolicies,
    selectPolicy: values.scaleUpSelectPolicy,
    stabilizationWindowSeconds: values.scaleUpStabilizationWindowSeconds,
    tolerance: values.scaleUpTolerance,
  });
  const scaleDown = buildScalingRules(values.enableScaleDownBehavior, {
    policies: values.scaleDownPolicies,
    selectPolicy: values.scaleDownSelectPolicy,
    stabilizationWindowSeconds: values.scaleDownStabilizationWindowSeconds,
    tolerance: values.scaleDownTolerance,
  });

  if (Object.keys(labels).length > 0) {
    metadata.labels = labels;
  }
  if (Object.keys(annotations).length > 0) {
    metadata.annotations = annotations;
  }
  if (scaleUp) {
    behavior.scaleUp = scaleUp;
  }
  if (scaleDown) {
    behavior.scaleDown = scaleDown;
  }

  return {
    apiVersion: HPA_API_VERSION,
    kind: HPA_KIND,
    metadata,
    spec: {
      scaleTargetRef: {
        apiVersion: normalizeText(values.targetApiVersion),
        kind: normalizeText(values.targetKind),
        name: normalizeText(values.targetName),
      },
      minReplicas: values.minReplicas,
      maxReplicas: values.maxReplicas,
      metrics: (values.metrics || []).map(buildMetricSpec),
      ...(Object.keys(behavior).length > 0 ? { behavior } : {}),
    },
  };
};

export const buildCreateHpaYaml = (
  values: CreateHorizontalPodAutoscalerFormValues,
) => stringify(buildCreateHpaManifest(values));
