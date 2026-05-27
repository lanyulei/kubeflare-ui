import {
  formatValue,
  getArrayValue,
  getRecordValue,
  getStringValue,
} from './helpers';

const buildPersistentVolumeClaimBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
) => {
  const metadata = getRecordValue(manifest?.metadata);
  const spec = getRecordValue(manifest?.spec);
  const status = getRecordValue(manifest?.status);
  const statusCapacity = getRecordValue(status?.capacity);
  const specResources = getRecordValue(spec?.resources);
  const specRequests = getRecordValue(specResources?.requests);

  return {
    namespace: metadata?.namespace || fallbackNamespace || '-',
    status: getStringValue(status?.phase),
    capacity: statusCapacity?.storage || specRequests?.storage,
    access_modes:
      getArrayValue(status?.accessModes).join('、') ||
      getArrayValue(spec?.accessModes).join('、'),
    storage_class: spec?.storageClassName,
    volume_name: spec?.volumeName,
    create_time: metadata?.creationTimestamp,
  };
};

const hasPersistentVolumeClaim = (
  pod: API.ClusterNodePodItem,
  claimName?: string,
) => {
  if (!claimName) {
    return false;
  }

  return (pod.volumes || []).some(
    (volume) =>
      volume.type === 'PersistentVolumeClaim' &&
      volume.source_name === claimName,
  );
};

const formatPersistentVolumeClaimValue = (value: unknown) => formatValue(value);

type PersistentVolumeClaimBasicInfo = ReturnType<
  typeof buildPersistentVolumeClaimBasicInfo
>;

export type { PersistentVolumeClaimBasicInfo };
export {
  buildPersistentVolumeClaimBasicInfo,
  formatPersistentVolumeClaimValue,
  hasPersistentVolumeClaim,
};
