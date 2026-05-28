import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

type PersistentVolumeClaimCreateMode =
  | 'storageClass'
  | 'persistentVolume'
  | 'nas';

type CreatePersistentVolumeClaimFormValues = {
  accessModes?: string[];
  annotations?: KeyValueEditorItem[];
  createMode?: PersistentVolumeClaimCreateMode;
  labels?: KeyValueEditorItem[];
  name?: string;
  namespace?: string;
  storageClassName?: string;
  storageSizeGi?: number;
  volumeName?: string;
};

export type {
  CreatePersistentVolumeClaimFormValues,
  PersistentVolumeClaimCreateMode,
};
