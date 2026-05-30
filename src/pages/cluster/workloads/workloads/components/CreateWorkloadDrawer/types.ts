import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

type WorkloadStorageCategory = 'none' | 'volume' | 'config';
type WorkloadStorageType =
  | 'none'
  | 'emptyDir'
  | 'persistentVolumeClaim'
  | 'volumeClaimTemplate'
  | 'hostPath'
  | 'configMap'
  | 'secret';
type WorkloadVolumeType = 'persistentVolumeClaim' | 'emptyDir' | 'hostPath';
type WorkloadConfigResourceType = 'configMap' | 'secret';
type WorkloadMountMode = 'none' | 'readWrite' | 'readOnly';
type WorkloadUpdateStrategyType = 'RollingUpdate' | 'Recreate' | 'OnDelete';
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

type ContainerType = 'worker' | 'init';
type ContainerHandlerType = 'httpGet' | 'exec' | 'tcpSocket';
type ContainerLifecycleActionName = 'postStart' | 'preStop';
type ContainerProbeKind = 'liveness' | 'readiness' | 'startup';
type ContainerProbeHandlerType = ContainerHandlerType;
type ContainerEnvSourceType = 'custom' | 'configMap' | 'secret';
type ContainerSeccompProfileType =
  | 'RuntimeDefault'
  | 'Localhost'
  | 'Unconfined';
type ContainerResizeRestartPolicy = 'NotRequired' | 'RestartContainer';
type PodSupplementalGroupsPolicy = 'Merge' | 'Strict';

type ContainerEnvItem = {
  id: string;
  sourceType?: ContainerEnvSourceType;
  keyName?: string;
  value?: string;
  resourceName?: string;
  resourceKey?: string;
};

type ContainerActionFormValue = {
  enabled?: boolean;
  handlerType?: ContainerHandlerType;
  scheme?: 'HTTP' | 'HTTPS';
  path?: string;
  port?: number;
  command?: string;
};

type ContainerLifecycleActionsValue = Partial<
  Record<ContainerLifecycleActionName, ContainerActionFormValue>
>;

type ContainerProbeFormValue = ContainerActionFormValue & {
  initialDelaySeconds?: number;
  timeoutSeconds?: number;
  periodSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
};

type ContainerHealthChecksValue = Partial<
  Record<ContainerProbeKind, ContainerProbeFormValue>
>;

type ContainerPortItem = {
  protocol?: string;
  name?: string;
  containerPort?: number;
  servicePort?: number;
};

type WorkloadContainerMountItem = {
  id: string;
  containerId?: string;
  containerName?: string;
  mountMode?: WorkloadMountMode;
  mountPath?: string;
  subPath?: string;
};

type WorkloadStorageKeyPathItem = {
  id: string;
  keyName?: string;
  path?: string;
};

type WorkloadStorageConfigItem = {
  id: string;
  storageCategory?: WorkloadStorageCategory;
  storageType?: WorkloadStorageType;
  volumeType?: WorkloadVolumeType;
  configResourceType?: WorkloadConfigResourceType;
  volumeName?: string;
  emptyDirSizeLimit?: string;
  hostPath?: string;
  claimName?: string;
  claimStorageClassName?: string;
  claimCapacity?: string;
  claimAccessModes?: string[];
  pvcNamePrefix?: string;
  pvcStorageClassName?: string;
  pvcAccessModes?: string[];
  pvcSizeGi?: number;
  configResourceName?: string;
  containerMounts?: WorkloadContainerMountItem[];
  selectSpecificKeys?: boolean;
  specificKeyPaths?: WorkloadStorageKeyPathItem[];
};

type CreateWorkloadContainerValues = {
  id?: string;
  containerName?: string;
  containerType?: ContainerType;
  image?: string;
  imagePullPolicy?: string;
  cpuRequest?: number;
  cpuLimit?: number;
  memoryRequest?: number;
  memoryLimit?: number;
  containerPorts?: ContainerPortItem[];
  containerPort?: number;
  protocol?: string;
  enableHealthCheck?: boolean;
  healthChecks?: ContainerHealthChecksValue;
  enableLifecycle?: boolean;
  lifecycleActions?: ContainerLifecycleActionsValue;
  postStartCommand?: string;
  preStopCommand?: string;
  enableStartupCommand?: boolean;
  startupCommand?: string;
  startupArgs?: string;
  enableContainerEnv?: boolean;
  containerEnv?: ContainerEnvItem[];
  enableContainerSecurityContext?: boolean;
  containerPrivileged?: boolean;
  containerRunAsNonRoot?: boolean;
  containerRunAsUser?: number;
  containerRunAsGroup?: number;
  containerReadOnlyRootFilesystem?: boolean;
  allowPrivilegeEscalation?: boolean;
  containerSeLinuxLevel?: string;
  containerSeLinuxRole?: string;
  containerSeLinuxType?: string;
  containerSeLinuxUser?: string;
  containerCapabilitiesAdd?: string[];
  containerCapabilitiesDrop?: string[];
  containerSeccompProfileType?: ContainerSeccompProfileType;
  containerSeccompProfileLocalhost?: string;
  enableResizePolicy?: boolean;
  cpuResizeRestartPolicy?: ContainerResizeRestartPolicy;
  memoryResizeRestartPolicy?: ContainerResizeRestartPolicy;
  syncHostTimezone?: boolean;
};

type CreateWorkloadFormValues = CreateWorkloadContainerValues & {
  name?: string;
  namespace?: string;
  replicas?: number;
  updateStrategyType?: WorkloadUpdateStrategyType;
  maxUnavailable?: string;
  maxSurge?: string;
  minReadySeconds?: number;
  updatePartition?: number;
  enablePodSecurityContext?: boolean;
  runAsNonRoot?: boolean;
  runAsUser?: number;
  runAsGroup?: number;
  fsGroup?: number;
  supplementalGroups?: string;
  supplementalGroupsPolicy?: PodSupplementalGroupsPolicy;
  seLinuxLevel?: string;
  seLinuxRole?: string;
  seLinuxType?: string;
  seLinuxUser?: string;
  enablePodGracefulTermination?: boolean;
  terminationGracePeriodSeconds?: number;
  podAnnotations?: KeyValueEditorItem[];
  podSchedulingRule?: WorkloadSchedulingRuleType;
  podSchedulingCustomType?: WorkloadSchedulingCustomType;
  podSchedulingCustomStrategy?: WorkloadSchedulingCustomStrategy;
  podSchedulingCustomTarget?: string;
  podSchedulingCustomTargetName?: string;
  podSchedulingCustomTargetLabels?: Record<string, string>;
  podSchedulingCustomRules?: WorkloadSchedulingCustomRule[];
  containers?: CreateWorkloadContainerValues[];
  storageCategory?: WorkloadStorageCategory;
  storageType?: WorkloadStorageType;
  volumeType?: WorkloadVolumeType;
  configResourceType?: WorkloadConfigResourceType;
  volumeName?: string;
  emptyDirSizeLimit?: string;
  hostPath?: string;
  claimName?: string;
  claimStorageClassName?: string;
  claimCapacity?: string;
  claimAccessModes?: string[];
  pvcNamePrefix?: string;
  pvcStorageClassName?: string;
  pvcAccessModes?: string[];
  pvcSizeGi?: number;
  configResourceName?: string;
  containerMounts?: WorkloadContainerMountItem[];
  selectSpecificKeys?: boolean;
  specificKeyPaths?: WorkloadStorageKeyPathItem[];
  storageItems?: WorkloadStorageConfigItem[];
  enableNodeSelector?: boolean;
  nodeSelectors?: KeyValueEditorItem[];
  selectedNodeNames?: string[];
  labels?: KeyValueEditorItem[];
  annotations?: KeyValueEditorItem[];
};

export type {
  ContainerActionFormValue,
  ContainerEnvItem,
  ContainerEnvSourceType,
  ContainerHandlerType,
  ContainerHealthChecksValue,
  ContainerLifecycleActionName,
  ContainerLifecycleActionsValue,
  ContainerPortItem,
  ContainerProbeFormValue,
  ContainerProbeHandlerType,
  ContainerProbeKind,
  ContainerResizeRestartPolicy,
  ContainerSeccompProfileType,
  ContainerType,
  CreateWorkloadContainerValues,
  CreateWorkloadFormValues,
  PodSupplementalGroupsPolicy,
  WorkloadConfigResourceType,
  WorkloadContainerMountItem,
  WorkloadMountMode,
  WorkloadSchedulingCustomRule,
  WorkloadSchedulingCustomStrategy,
  WorkloadSchedulingCustomType,
  WorkloadSchedulingRuleType,
  WorkloadStorageCategory,
  WorkloadStorageConfigItem,
  WorkloadStorageKeyPathItem,
  WorkloadStorageType,
  WorkloadUpdateStrategyType,
  WorkloadVolumeType,
};
