type StorageClassStorageType = 'block' | 'object' | 'file';

type StorageClassBooleanSelectValue = 'true' | 'false';

type StorageClassReclaimPolicy = 'Delete' | 'Retain';

type StorageClassVolumeBindingMode = 'Immediate' | 'WaitForFirstConsumer';

type StorageClassParameterItem = {
  id: string;
  keyName: string;
  value: string;
};

type CreateStorageClassFormValues = {
  accessModes?: string[];
  allowVolumeExpansion?: StorageClassBooleanSelectValue;
  name?: string;
  parameters?: StorageClassParameterItem[];
  provisioner?: string;
  reclaimPolicy?: StorageClassReclaimPolicy;
  storageType?: StorageClassStorageType;
  volumeBindingMode?: StorageClassVolumeBindingMode;
};

export type {
  CreateStorageClassFormValues,
  StorageClassBooleanSelectValue,
  StorageClassParameterItem,
  StorageClassReclaimPolicy,
  StorageClassStorageType,
  StorageClassVolumeBindingMode,
};
