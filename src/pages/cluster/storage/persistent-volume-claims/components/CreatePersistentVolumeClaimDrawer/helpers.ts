import { stringify } from 'yaml';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type {
  CreatePersistentVolumeClaimFormValues,
  PersistentVolumeClaimCreateMode,
} from './types';

const PVC_API_VERSION = 'v1';
const PVC_KIND = 'PersistentVolumeClaim';
const PVC_RESOURCE_TYPE: API.ClusterResourceCreateType =
  'PersistentVolumeClaim';
const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const createKeyValueItem = (keyName = '', value = ''): KeyValueEditorItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  keyName,
  value,
});

const normalizeName = (value?: string) => value?.trim() || '';

const getInitialPersistentVolumeClaimValues = (
  namespace?: string,
): CreatePersistentVolumeClaimFormValues => ({
  accessModes: ['ReadWriteOnce'],
  annotations: [createKeyValueItem()],
  createMode: 'storageClass',
  labels: [createKeyValueItem()],
  name: undefined,
  namespace,
  storageClassName: undefined,
  storageSizeGi: 10,
  volumeName: undefined,
});

const keyValueItemsToRecord = (items?: KeyValueEditorItem[]) => {
  const entries = (items || [])
    .map((item) => [item.keyName.trim(), item.value] as const)
    .filter(([key]) => key);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const getModeDescription = (mode?: PersistentVolumeClaimCreateMode) => {
  if (mode === 'persistentVolume') {
    return '绑定已有持久卷创建';
  }
  if (mode === 'nas') {
    return '绑定已有 NAS 卷创建';
  }
  return '通过存储类创建';
};

const buildCreatePersistentVolumeClaimManifest = (
  values: CreatePersistentVolumeClaimFormValues,
): Record<string, unknown> => {
  const labels = keyValueItemsToRecord(values.labels);
  const annotations = keyValueItemsToRecord(values.annotations);
  const mode = values.createMode || 'storageClass';
  const spec: Record<string, unknown> = {
    accessModes:
      values.accessModes && values.accessModes.length > 0
        ? values.accessModes
        : ['ReadWriteOnce'],
    resources: {
      requests: {
        storage: `${values.storageSizeGi || 10}Gi`,
      },
    },
  };

  if (mode === 'storageClass' || mode === 'nas') {
    spec.storageClassName = normalizeName(values.storageClassName);
  }
  if (mode === 'persistentVolume' || mode === 'nas') {
    spec.volumeName = normalizeName(values.volumeName);
  }

  return {
    apiVersion: PVC_API_VERSION,
    kind: PVC_KIND,
    metadata: {
      name: normalizeName(values.name),
      namespace: normalizeName(values.namespace),
      ...(labels ? { labels } : {}),
      ...(annotations ? { annotations } : {}),
    },
    spec,
  };
};

const buildCreatePersistentVolumeClaimYaml = (
  values: CreatePersistentVolumeClaimFormValues,
) => stringify(buildCreatePersistentVolumeClaimManifest(values), { indent: 2 });

const getPersistentVolumeClaimStepFields = (
  step: number,
  values?: CreatePersistentVolumeClaimFormValues,
): (keyof CreatePersistentVolumeClaimFormValues)[] => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 1) {
    const mode = values?.createMode || 'storageClass';
    if (mode === 'persistentVolume') {
      return ['createMode', 'volumeName', 'accessModes', 'storageSizeGi'];
    }

    if (mode === 'nas') {
      return [
        'createMode',
        'storageClassName',
        'volumeName',
        'accessModes',
        'storageSizeGi',
      ];
    }

    return ['createMode', 'storageClassName', 'accessModes', 'storageSizeGi'];
  }

  return ['labels', 'annotations'];
};

export {
  buildCreatePersistentVolumeClaimManifest,
  buildCreatePersistentVolumeClaimYaml,
  createKeyValueItem,
  getInitialPersistentVolumeClaimValues,
  getModeDescription,
  getPersistentVolumeClaimStepFields,
  NAME_PATTERN,
  PVC_API_VERSION,
  PVC_KIND,
  PVC_RESOURCE_TYPE,
};
