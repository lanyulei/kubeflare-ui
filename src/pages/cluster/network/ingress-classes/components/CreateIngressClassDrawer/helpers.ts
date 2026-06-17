import { stringify } from 'yaml';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type { CreateIngressClassFormValues } from './types';

const INGRESS_CLASS_API_VERSION = 'networking.k8s.io/v1';
const INGRESS_CLASS_KIND = 'IngressClass';
const INGRESS_CLASS_RESOURCE_TYPE: API.ClusterResourceCreateType =
  'IngressClass';
const INGRESS_CLASS_DEFAULT_ANNOTATION =
  'ingressclass.kubernetes.io/is-default-class';
const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const trimValue = (value?: string) => value?.trim() || '';

const toRecord = (items?: KeyValueEditorItem[]) =>
  (items || []).reduce<Record<string, string>>((record, item) => {
    const keyName = trimValue(item.keyName);
    if (keyName) {
      record[keyName] = trimValue(item.value);
    }
    return record;
  }, {});

const getInitialCreateIngressClassValues =
  (): CreateIngressClassFormValues => ({
    annotations: [],
    controller: undefined,
    enableParameters: 'false',
    isDefaultClass: 'false',
    labels: [],
    name: undefined,
    parameterApiGroup: undefined,
    parameterKind: undefined,
    parameterName: undefined,
    parameterNamespace: undefined,
    parameterScope: 'Cluster',
  });

const buildIngressClassParameters = (values: CreateIngressClassFormValues) => {
  if (values.enableParameters !== 'true') {
    return undefined;
  }

  const scope = values.parameterScope || 'Cluster';
  const parameters: Record<string, unknown> = {
    kind: trimValue(values.parameterKind),
    name: trimValue(values.parameterName),
    scope,
  };
  const apiGroup = trimValue(values.parameterApiGroup);
  const namespace = trimValue(values.parameterNamespace);

  if (apiGroup) {
    parameters.apiGroup = apiGroup;
  }
  if (scope === 'Namespace' && namespace) {
    parameters.namespace = namespace;
  }

  return parameters;
};

const buildCreateIngressClassManifest = (
  values: CreateIngressClassFormValues,
): Record<string, unknown> => {
  const labels = toRecord(values.labels);
  const annotations = toRecord(values.annotations);
  const parameters = buildIngressClassParameters(values);

  if (values.isDefaultClass === 'true') {
    annotations[INGRESS_CLASS_DEFAULT_ANNOTATION] = 'true';
  } else {
    delete annotations[INGRESS_CLASS_DEFAULT_ANNOTATION];
  }

  return {
    apiVersion: INGRESS_CLASS_API_VERSION,
    kind: INGRESS_CLASS_KIND,
    metadata: {
      name: trimValue(values.name),
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
      ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    },
    spec: {
      controller: trimValue(values.controller),
      ...(parameters ? { parameters } : {}),
    },
  };
};

const buildCreateIngressClassYaml = (values: CreateIngressClassFormValues) =>
  stringify(buildCreateIngressClassManifest(values), { indent: 2 });

const getIngressClassStepFields = (
  step: number,
): (keyof CreateIngressClassFormValues)[] => {
  if (step === 0) {
    return ['name', 'controller', 'isDefaultClass'];
  }
  if (step === 1) {
    return [
      'enableParameters',
      'parameterApiGroup',
      'parameterKind',
      'parameterName',
      'parameterNamespace',
      'parameterScope',
    ];
  }

  return ['labels', 'annotations'];
};

const hasKeyValueContent = (items?: KeyValueEditorItem[]) =>
  (items || []).some((item) => trimValue(item.keyName));

const validateKeyValueItems = (
  items: KeyValueEditorItem[] | undefined,
  label: string,
) => {
  const keys = (items || [])
    .map((item) => trimValue(item.keyName))
    .filter(Boolean);

  if (new Set(keys).size !== keys.length) {
    return `${label}键不能重复`;
  }

  return undefined;
};

const validateIngressClassParameters = (
  values: CreateIngressClassFormValues,
) => {
  if (values.enableParameters !== 'true') {
    return undefined;
  }

  if (!trimValue(values.parameterKind)) {
    return '参数引用必须填写类型';
  }
  if (!trimValue(values.parameterName)) {
    return '参数引用必须填写名称';
  }
  if (
    values.parameterScope === 'Namespace' &&
    !trimValue(values.parameterNamespace)
  ) {
    return '命名空间级参数引用必须填写命名空间';
  }

  return undefined;
};

const validateIngressClassMetadata = (values: CreateIngressClassFormValues) =>
  validateKeyValueItems(values.labels, '标签') ||
  validateKeyValueItems(values.annotations, '注解');

const validateIngressClassStep = (
  values: CreateIngressClassFormValues,
  step: number,
) => {
  if (step === 1) {
    return validateIngressClassParameters(values);
  }
  if (step === 2) {
    return validateIngressClassMetadata(values);
  }

  return undefined;
};

const validateIngressClassFormValues = (values: CreateIngressClassFormValues) =>
  validateIngressClassParameters(values) ||
  validateIngressClassMetadata(values);

export {
  buildCreateIngressClassManifest,
  buildCreateIngressClassYaml,
  getIngressClassStepFields,
  getInitialCreateIngressClassValues,
  hasKeyValueContent,
  INGRESS_CLASS_API_VERSION,
  INGRESS_CLASS_DEFAULT_ANNOTATION,
  INGRESS_CLASS_KIND,
  INGRESS_CLASS_RESOURCE_TYPE,
  NAME_PATTERN,
  validateIngressClassFormValues,
  validateIngressClassStep,
};
