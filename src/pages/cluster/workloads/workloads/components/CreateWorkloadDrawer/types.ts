import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

type WorkloadStorageType = 'none' | 'emptyDir' | 'persistentVolumeClaim';
type WorkloadUpdateStrategyType = 'RollingUpdate' | 'Recreate';
type WorkloadSchedulingRuleType =
  | 'default'
  | 'spread'
  | 'centralized'
  | 'custom';
type WorkloadSchedulingCustomType = 'affinity' | 'antiAffinity';
type WorkloadSchedulingCustomStrategy = 'preferred' | 'required';

type WorkloadSchedulingCustomRule = {
  type?: WorkloadSchedulingCustomType;
  strategy?: WorkloadSchedulingCustomStrategy;
  target?: string;
  targetName?: string;
  targetLabels?: Record<string, string>;
};

type CreateWorkloadFormValues = {
  name?: string;
  namespace?: string;
  replicas?: number;
  updateStrategyType?: WorkloadUpdateStrategyType;
  maxUnavailable?: string;
  maxSurge?: string;
  enablePodSecurityContext?: boolean;
  runAsNonRoot?: boolean;
  runAsUser?: number;
  runAsGroup?: number;
  seLinuxLevel?: string;
  seLinuxRole?: string;
  seLinuxType?: string;
  seLinuxUser?: string;
  enablePodGracefulTermination?: boolean;
  terminationGracePeriodSeconds?: number;
  enablePodMetadata?: boolean;
  podAnnotations?: KeyValueEditorItem[];
  podSchedulingRule?: WorkloadSchedulingRuleType;
  podSchedulingCustomType?: WorkloadSchedulingCustomType;
  podSchedulingCustomStrategy?: WorkloadSchedulingCustomStrategy;
  podSchedulingCustomTarget?: string;
  podSchedulingCustomTargetName?: string;
  podSchedulingCustomTargetLabels?: Record<string, string>;
  podSchedulingCustomRules?: WorkloadSchedulingCustomRule[];
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

export type {
  CreateWorkloadFormValues,
  WorkloadSchedulingCustomRule,
  WorkloadSchedulingCustomStrategy,
  WorkloadSchedulingCustomType,
  WorkloadSchedulingRuleType,
  WorkloadStorageType,
  WorkloadUpdateStrategyType,
};
