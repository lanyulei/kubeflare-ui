import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

type WorkloadStorageType = 'none' | 'emptyDir' | 'persistentVolumeClaim';

type CreateWorkloadFormValues = {
  name?: string;
  namespace?: string;
  description?: string;
  template?: string;
  alias?: string;
  replicas?: number;
  containerName?: string;
  image?: string;
  imagePullPolicy?: string;
  containerPort?: number;
  protocol?: string;
  storageType?: WorkloadStorageType;
  volumeName?: string;
  mountPath?: string;
  claimName?: string;
  readOnly?: boolean;
  labels?: KeyValueEditorItem[];
  annotations?: KeyValueEditorItem[];
};

export type { CreateWorkloadFormValues, WorkloadStorageType };
