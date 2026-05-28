import { stringify } from 'yaml';
import type { ConfigMapDataItem, CreateConfigMapFormValues } from './types';

const CONFIG_MAP_API_VERSION = 'v1';
const CONFIG_MAP_KIND = 'ConfigMap';
const CONFIG_MAP_RESOURCE_TYPE: API.ClusterResourceCreateType = 'ConfigMap';
const CONFIG_MAP_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;
const CONFIG_MAP_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createConfigMapDataItem = (
  keyName = '',
  value = '',
): ConfigMapDataItem => ({
  id: createId(),
  keyName,
  value,
});

const getInitialCreateConfigMapValues = (
  namespace?: string,
): CreateConfigMapFormValues => ({
  dataItems: [],
  name: undefined,
  namespace,
});

const normalizeText = (value?: string) => value?.trim() || '';

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getStringValue = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const normalizeDataItems = (items?: ConfigMapDataItem[]) =>
  (items || [])
    .map((item) => ({
      keyName: normalizeText(item.keyName),
      value: item.value ?? '',
    }))
    .filter((item) => item.keyName);

const hasConfigMapDataContent = (values: CreateConfigMapFormValues) =>
  normalizeDataItems(values.dataItems).length > 0;

const validateConfigMapDataItems = (items?: ConfigMapDataItem[]) => {
  const keys = new Set<string>();

  for (const item of items || []) {
    const keyName = normalizeText(item.keyName);
    const value = item.value ?? '';

    if (!keyName && value.trim()) {
      return '请填写数据键';
    }
    if (!keyName) {
      continue;
    }
    if (keyName.length > 253) {
      return '键最长 253 个字符';
    }
    if (!CONFIG_MAP_KEY_PATTERN.test(keyName)) {
      return '键只能包含字母、数字、点（.）、下划线（_）和连字符（-）';
    }
    if (keys.has(keyName)) {
      return '数据键不能重复';
    }

    keys.add(keyName);
  }

  return undefined;
};

const buildConfigMapData = (items?: ConfigMapDataItem[]) =>
  normalizeDataItems(items).reduce<Record<string, string>>((data, item) => {
    data[item.keyName] = item.value;
    return data;
  }, {});

const buildCreateConfigMapManifest = (
  values: CreateConfigMapFormValues,
): Record<string, unknown> => ({
  apiVersion: CONFIG_MAP_API_VERSION,
  kind: CONFIG_MAP_KIND,
  metadata: {
    name: normalizeText(values.name),
    namespace: normalizeText(values.namespace),
  },
  data: buildConfigMapData(values.dataItems),
});

const buildCreateConfigMapYaml = (values: CreateConfigMapFormValues) =>
  stringify(buildCreateConfigMapManifest(values), { indent: 2 });

const getConfigMapFormValuesFromManifest = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
): CreateConfigMapFormValues => {
  const metadata = getRecordValue(manifest?.metadata);
  const data = getRecordValue(manifest?.data) || {};

  return {
    ...getInitialCreateConfigMapValues(
      getStringValue(metadata?.namespace) || fallbackNamespace,
    ),
    name: getStringValue(metadata?.name),
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace,
    dataItems: Object.entries(data).flatMap(([keyName, value]) =>
      typeof value === 'string'
        ? [createConfigMapDataItem(keyName, value)]
        : [],
    ),
  };
};

const buildUpdatedConfigMapSettingsManifest = (
  manifest: Record<string, unknown>,
  values: CreateConfigMapFormValues,
): Record<string, unknown> => {
  const data = buildConfigMapData(values.dataItems);
  const nextManifest: Record<string, unknown> = {
    ...manifest,
    data,
  };

  if (Object.keys(data).length === 0) {
    delete nextManifest.data;
  }

  return nextManifest;
};

const getConfigMapStepFields = (
  step: number,
): (keyof CreateConfigMapFormValues)[] => {
  if (step === 0) {
    return ['name', 'namespace'];
  }

  return ['dataItems'];
};

export {
  buildConfigMapData,
  buildCreateConfigMapManifest,
  buildCreateConfigMapYaml,
  buildUpdatedConfigMapSettingsManifest,
  CONFIG_MAP_API_VERSION,
  CONFIG_MAP_KEY_PATTERN,
  CONFIG_MAP_KIND,
  CONFIG_MAP_NAME_PATTERN,
  CONFIG_MAP_RESOURCE_TYPE,
  createConfigMapDataItem,
  getConfigMapFormValuesFromManifest,
  getConfigMapStepFields,
  getInitialCreateConfigMapValues,
  hasConfigMapDataContent,
  validateConfigMapDataItems,
};
