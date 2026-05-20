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
  terminationGracePeriodSeconds?: number;
  podAnnotations?: KeyValueEditorItem[];
  podSchedulingRule?: WorkloadSchedulingRuleType;
  podSchedulingCustomType?: WorkloadSchedulingCustomType;
  podSchedulingCustomStrategy?: WorkloadSchedulingCustomStrategy;
  podSchedulingCustomTarget?: string;
  podSchedulingCustomTargetName?: string;
  podSchedulingCustomTargetLabels?: Record<string, string>;
  podSchedulingCustomRules?: WorkloadSchedulingCustomRule[];
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
  syncHostTimezone?: boolean;
  storageType?: WorkloadStorageType;
  volumeName?: string;
  mountPath?: string;
  claimName?: string;
  readOnly?: boolean;
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
  ContainerSeccompProfileType,
  ContainerType,
  CreateWorkloadFormValues,
  WorkloadSchedulingCustomRule,
  WorkloadSchedulingCustomStrategy,
  WorkloadSchedulingCustomType,
  WorkloadSchedulingRuleType,
  WorkloadStorageType,
  WorkloadUpdateStrategyType,
};
