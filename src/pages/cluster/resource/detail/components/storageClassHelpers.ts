import { formatValue, getRecordValue, getStringValue } from './helpers';

const DEFAULT_CLASS_ANNOTATIONS = [
  'storageclass.kubernetes.io/is-default-class',
  'storageclass.beta.kubernetes.io/is-default-class',
];

const SNAPSHOT_ANNOTATIONS = [
  'storageclass.kubesphere.io/support-snapshot',
  'storageclass.kubeflare.io/support-snapshot',
  'storageclass.kubernetes.io/support-snapshot',
];

const getBooleanAnnotation = (
  annotations: Record<string, unknown> | undefined,
  keys: string[],
) => {
  const value = keys
    .map((key) => getStringValue(annotations?.[key]))
    .find((item) => item !== undefined);

  if (value === undefined) {
    return undefined;
  }

  return value.toLowerCase() === 'true';
};

const buildStorageClassBasicInfo = (manifest?: Record<string, unknown>) => {
  const metadata = getRecordValue(manifest?.metadata);
  const annotations = getRecordValue(metadata?.annotations);
  const parameters = getRecordValue(manifest?.parameters);

  return {
    default_volume: getBooleanAnnotation(
      annotations,
      DEFAULT_CLASS_ANNOTATIONS,
    ),
    allow_volume_expansion:
      typeof manifest?.allowVolumeExpansion === 'boolean'
        ? manifest.allowVolumeExpansion
        : undefined,
    reclaim_policy: manifest?.reclaimPolicy,
    allow_volume_snapshot:
      getBooleanAnnotation(annotations, SNAPSHOT_ANNOTATIONS) ??
      (typeof parameters?.allowVolumeSnapshot === 'string'
        ? parameters.allowVolumeSnapshot.toLowerCase() === 'true'
        : undefined),
  };
};

const formatStorageClassBoolean = (value: unknown) => {
  if (typeof value !== 'boolean') {
    return '-';
  }

  return value ? '是' : '否';
};

const getReclaimPolicyLabel = (value: unknown) => {
  if (value === 'Delete') {
    return '删除';
  }
  if (value === 'Retain') {
    return '保留';
  }
  if (value === 'Recycle') {
    return '回收';
  }

  return formatValue(value);
};

type StorageClassBasicInfo = ReturnType<typeof buildStorageClassBasicInfo>;

export type { StorageClassBasicInfo };
export {
  buildStorageClassBasicInfo,
  formatStorageClassBoolean,
  getReclaimPolicyLabel,
};
