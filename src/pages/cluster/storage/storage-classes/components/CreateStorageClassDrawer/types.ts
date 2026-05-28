import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

type StorageClassStorageType = 'block' | 'object' | 'file';

type StorageClassBooleanSelectValue = 'true' | 'false';

type StorageClassReclaimPolicy = 'Delete' | 'Retain';

type StorageClassVolumeBindingMode = 'Immediate' | 'WaitForFirstConsumer';

type CreateStorageClassFormValues = {
  accessModes?: string[];
  allowVolumeExpansion?: StorageClassBooleanSelectValue;
  name?: string;
  parameters?: KeyValueEditorItem[];
  provisioner?: string;
  reclaimPolicy?: StorageClassReclaimPolicy;
  storageType?: StorageClassStorageType;
  volumeBindingMode?: StorageClassVolumeBindingMode;
};

export type {
  CreateStorageClassFormValues,
  StorageClassBooleanSelectValue,
  StorageClassReclaimPolicy,
  StorageClassStorageType,
  StorageClassVolumeBindingMode,
};
