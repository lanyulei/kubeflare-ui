import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type { StringListEditorItem } from '@/components/StringListEditor';

type PersistentVolumeBooleanSelectValue = 'true' | 'false';

type PersistentVolumeHostPathType =
  | ''
  | 'BlockDevice'
  | 'CharDevice'
  | 'Directory'
  | 'DirectoryOrCreate'
  | 'File'
  | 'FileOrCreate'
  | 'Socket';

type PersistentVolumeNodeSelectorOperator =
  | 'DoesNotExist'
  | 'Exists'
  | 'Gt'
  | 'In'
  | 'Lt'
  | 'NotIn';

type PersistentVolumeReclaimPolicy = 'Delete' | 'Recycle' | 'Retain';

type PersistentVolumeSourceType = 'csi' | 'hostPath' | 'local' | 'nfs';

type PersistentVolumeMode = 'Block' | 'Filesystem';

type CreatePersistentVolumeFormValues = {
  accessModes?: string[];
  annotations?: KeyValueEditorItem[];
  capacityGi?: number;
  claimName?: string;
  claimNamespace?: string;
  csiDriver?: string;
  csiFsType?: string;
  csiReadOnly?: PersistentVolumeBooleanSelectValue;
  csiVolumeAttributes?: KeyValueEditorItem[];
  csiVolumeHandle?: string;
  hostPath?: string;
  hostPathType?: PersistentVolumeHostPathType;
  labels?: KeyValueEditorItem[];
  localFsType?: string;
  localPath?: string;
  mountOptions?: StringListEditorItem[];
  name?: string;
  nfsPath?: string;
  nfsReadOnly?: PersistentVolumeBooleanSelectValue;
  nfsServer?: string;
  nodeAffinityKey?: string;
  nodeAffinityOperator?: PersistentVolumeNodeSelectorOperator;
  nodeAffinityValues?: StringListEditorItem[];
  persistentVolumeReclaimPolicy?: PersistentVolumeReclaimPolicy;
  storageClassName?: string;
  volumeMode?: PersistentVolumeMode;
  volumeSourceType?: PersistentVolumeSourceType;
};

type PersistentVolumeValidationError = {
  field: keyof CreatePersistentVolumeFormValues;
  message: string;
};

export type {
  CreatePersistentVolumeFormValues,
  PersistentVolumeBooleanSelectValue,
  PersistentVolumeHostPathType,
  PersistentVolumeMode,
  PersistentVolumeNodeSelectorOperator,
  PersistentVolumeReclaimPolicy,
  PersistentVolumeSourceType,
  PersistentVolumeValidationError,
};
