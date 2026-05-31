import { stringify } from 'yaml';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type { CreateStorageClassFormValues } from './types';

const STORAGE_CLASS_API_VERSION = 'storage.k8s.io/v1';
const STORAGE_CLASS_KIND = 'StorageClass';
const STORAGE_CLASS_RESOURCE_TYPE: API.ClusterResourceCreateType =
  'StorageClass';
const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const SUPPORTED_ACCESS_MODE_ANNOTATIONS = [
  'storageclass.kubeflare.io/supported-access-modes',
];

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createKeyValueItem = (
  keyName = '',
  value = '',
): KeyValueEditorItem => ({
  id: createId(),
  keyName,
  value,
});

const normalizeName = (value?: string) => value?.trim() || '';

const keyValueItemsToRecord = (items?: KeyValueEditorItem[]) => {
  const entries = (items || [])
    .map((item) => [item.keyName.trim(), item.value] as const)
    .filter(([key]) => key);

  return entries.length > 0 ? Object.fromEntries(entries) : {};
};

const getInitialStorageClassValues = (): CreateStorageClassFormValues => ({
  accessModes: ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteMany'],
  allowVolumeExpansion: 'false',
  name: undefined,
  parameters: [createKeyValueItem()],
  provisioner: undefined,
  reclaimPolicy: 'Delete',
  storageType: undefined,
  volumeBindingMode: 'WaitForFirstConsumer',
});

const buildCreateStorageClassManifest = (
  values: CreateStorageClassFormValues,
): Record<string, unknown> => {
  const accessModes =
    values.accessModes && values.accessModes.length > 0
      ? values.accessModes
      : ['ReadWriteOnce'];
  const annotations = Object.fromEntries(
    SUPPORTED_ACCESS_MODE_ANNOTATIONS.map((key) => [
      key,
      JSON.stringify(accessModes),
    ]),
  );
  const parameters = {
    ...keyValueItemsToRecord(values.parameters),
    ...(values.storageType ? { type: values.storageType } : {}),
  };

  return {
    apiVersion: STORAGE_CLASS_API_VERSION,
    kind: STORAGE_CLASS_KIND,
    metadata: {
      name: normalizeName(values.name),
      annotations,
    },
    provisioner: normalizeName(values.provisioner),
    reclaimPolicy: values.reclaimPolicy || 'Delete',
    volumeBindingMode: values.volumeBindingMode || 'WaitForFirstConsumer',
    allowVolumeExpansion: values.allowVolumeExpansion === 'true',
    ...(Object.keys(parameters).length > 0 ? { parameters } : {}),
  };
};

const buildCreateStorageClassYaml = (values: CreateStorageClassFormValues) =>
  stringify(buildCreateStorageClassManifest(values), { indent: 2 });

const getStorageClassStepFields = (
  step: number,
): (keyof CreateStorageClassFormValues)[] => {
  if (step === 0) {
    return ['name', 'storageType'];
  }

  return [
    'accessModes',
    'allowVolumeExpansion',
    'parameters',
    'provisioner',
    'reclaimPolicy',
    'volumeBindingMode',
  ];
};

const validateStorageClassParameters = (items?: KeyValueEditorItem[]) => {
  const normalizedKeys = (items || [])
    .map((item) => normalizeName(item.keyName))
    .filter(Boolean);

  if (new Set(normalizedKeys).size !== normalizedKeys.length) {
    return '参数键不能重复';
  }

  return undefined;
};

export {
  buildCreateStorageClassManifest,
  buildCreateStorageClassYaml,
  createKeyValueItem,
  getInitialStorageClassValues,
  getStorageClassStepFields,
  NAME_PATTERN,
  STORAGE_CLASS_API_VERSION,
  STORAGE_CLASS_KIND,
  STORAGE_CLASS_RESOURCE_TYPE,
  validateStorageClassParameters,
};
