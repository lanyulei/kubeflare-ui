import { stringify } from 'yaml';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type {
  ContainerActionFormValue,
  ContainerProbeFormValue,
  ContainerProbeKind,
  CreateWorkloadContainerValues,
  CreateWorkloadFormValues,
  WorkloadSchedulingCustomRule,
} from './types';

const DEFAULT_APP_LABEL_KEY = 'app';

const workloadApiVersions: Record<API.ClusterWorkloadType, string> = {
  Deployment: 'apps/v1',
  StatefulSet: 'apps/v1',
  DaemonSet: 'apps/v1',
};

const workloadKinds: Record<API.ClusterWorkloadType, string> = {
  Deployment: 'Deployment',
  StatefulSet: 'StatefulSet',
  DaemonSet: 'DaemonSet',
};

const workloadTypeNames: Record<API.ClusterWorkloadType, string> = {
  Deployment: '部署',
  StatefulSet: '有状态副本集',
  DaemonSet: '守护进程集',
};

const toRecord = (items?: KeyValueEditorItem[]) =>
  (items || []).reduce<Record<string, string>>((record, item) => {
    const keyName = item.keyName.trim();
    if (keyName) {
      record[keyName] = item.value.trim();
    }
    return record;
  }, {});

const getWorkloadResourceName = (type: API.ClusterWorkloadType) =>
  workloadTypeNames[type];

const getInitialCreateWorkloadValues = (
  type: API.ClusterWorkloadType,
  namespace?: string,
): CreateWorkloadFormValues => ({
  namespace,
  replicas: type === 'DaemonSet' ? undefined : 1,
  updateStrategyType: 'RollingUpdate',
  maxUnavailable: '25%',
  maxSurge: '25%',
  enablePodSecurityContext: false,
  runAsNonRoot: false,
  terminationGracePeriodSeconds: 30,
  podAnnotations: [],
  podSchedulingRule: 'default',
  podSchedulingCustomRules: [],
  containerType: 'worker',
  imagePullPolicy: 'IfNotPresent',
  containerPorts: [{ protocol: 'HTTP', name: 'http-0' }],
  enableHealthCheck: false,
  healthChecks: {},
  enableLifecycle: false,
  lifecycleActions: {},
  enableStartupCommand: false,
  enableContainerEnv: false,
  containerEnv: [],
  enableContainerSecurityContext: false,
  containerPrivileged: false,
  containerRunAsNonRoot: false,
  containerReadOnlyRootFilesystem: false,
  allowPrivilegeEscalation: false,
  containerCapabilitiesAdd: [''],
  containerCapabilitiesDrop: [''],
  containerSeccompProfileType: undefined,
  containerSeccompProfileLocalhost: '',
  syncHostTimezone: false,
  containers: [],
  protocol: 'TCP',
  storageType: 'none',
  volumeName: 'data',
  labels: [],
  annotations: [],
});

const normalizeName = (value?: string) => value?.trim() || '';

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const toResourceValue = (value?: number, unit?: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return unit ? `${value}${unit}` : `${value}`;
};

const setIfDefined = (
  target: Record<string, unknown>,
  key: string,
  value?: number | string | boolean,
) => {
  if (value === undefined || value === '') {
    return;
  }
  target[key] = value;
};

const splitCommandText = (value?: string) =>
  (value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeStringList = (value?: string[]) =>
  (value || []).map((item) => item.trim()).filter(Boolean);

const normalizeContainerPortProtocol = (protocol?: string) => {
  if (protocol === 'UDP' || protocol === 'SCTP') {
    return protocol;
  }

  return 'TCP';
};

const getContainerPorts = (values: CreateWorkloadContainerValues) => {
  const ports = (values.containerPorts || [])
    .filter((port) => port.containerPort)
    .map((port) => {
      const portConfig: Record<string, unknown> = {
        containerPort: port.containerPort,
        protocol: normalizeContainerPortProtocol(port.protocol),
      };
      const portName = normalizeOptionalText(port.name);

      if (portName) {
        portConfig.name = portName;
      }

      return portConfig;
    });

  if (ports.length > 0) {
    return ports;
  }

  return values.containerPort
    ? [
        {
          containerPort: values.containerPort,
          protocol: normalizeContainerPortProtocol(values.protocol),
        },
      ]
    : undefined;
};

const getContainerResources = (values: CreateWorkloadContainerValues) => {
  const requests: Record<string, string> = {};
  const limits: Record<string, string> = {};
  const cpuRequest = toResourceValue(values.cpuRequest);
  const cpuLimit = toResourceValue(values.cpuLimit);
  const memoryRequest = toResourceValue(values.memoryRequest, 'Mi');
  const memoryLimit = toResourceValue(values.memoryLimit, 'Mi');

  if (cpuRequest) {
    requests.cpu = cpuRequest;
  }
  if (memoryRequest) {
    requests.memory = memoryRequest;
  }
  if (cpuLimit) {
    limits.cpu = cpuLimit;
  }
  if (memoryLimit) {
    limits.memory = memoryLimit;
  }

  if (Object.keys(requests).length === 0 && Object.keys(limits).length === 0) {
    return undefined;
  }

  return {
    ...(Object.keys(requests).length > 0 ? { requests } : {}),
    ...(Object.keys(limits).length > 0 ? { limits } : {}),
  };
};

type ContainerEnvManifestItem = {
  name: string;
  value?: string;
  valueFrom?: {
    configMapKeyRef?: {
      name: string;
      key: string;
    };
    secretKeyRef?: {
      name: string;
      key: string;
    };
  };
};

const getContainerEnv = (values: CreateWorkloadContainerValues) => {
  if (!values.enableContainerEnv) {
    return undefined;
  }

  const env = (values.containerEnv || []).flatMap<ContainerEnvManifestItem>(
    (item) => {
      const sourceType = item.sourceType || 'custom';
      if (sourceType === 'configMap' || sourceType === 'secret') {
        const resourceKey = normalizeOptionalText(item.resourceKey);
        const name = normalizeOptionalText(item.keyName) || resourceKey;
        const resourceName = normalizeOptionalText(item.resourceName);

        if (!name || !resourceName || !resourceKey) {
          return [];
        }

        return [
          {
            name,
            valueFrom:
              sourceType === 'configMap'
                ? {
                    configMapKeyRef: {
                      name: resourceName,
                      key: resourceKey,
                    },
                  }
                : {
                    secretKeyRef: {
                      name: resourceName,
                      key: resourceKey,
                    },
                  },
          },
        ];
      }

      const name = normalizeOptionalText(item.keyName);
      if (!name) {
        return [];
      }

      return [
        {
          name,
          value: item.value ?? '',
        },
      ];
    },
  );

  return env.length > 0 ? env : undefined;
};

const getExecAction = (commandText?: string) => {
  const command = splitCommandText(commandText);

  return command.length > 0
    ? {
        exec: {
          command,
        },
      }
    : undefined;
};

const getLifecycleAction = (
  action?: ContainerActionFormValue,
  legacyCommand?: string,
) => {
  if (!action?.enabled) {
    return getExecAction(legacyCommand);
  }

  if (action.handlerType === 'exec') {
    return getExecAction(action.command);
  }

  if (action.handlerType === 'tcpSocket') {
    return action.port
      ? {
          tcpSocket: {
            port: action.port,
          },
        }
      : undefined;
  }

  const path = normalizeOptionalText(action.path);

  return path && action.port
    ? {
        httpGet: {
          scheme: action.scheme || 'HTTP',
          path,
          port: action.port,
        },
      }
    : undefined;
};

const getContainerLifecycle = (values: CreateWorkloadContainerValues) => {
  if (!values.enableLifecycle) {
    return undefined;
  }

  const lifecycleActions = values.lifecycleActions;
  const postStart = getLifecycleAction(
    lifecycleActions?.postStart,
    lifecycleActions ? undefined : values.postStartCommand,
  );
  const preStop = getLifecycleAction(
    lifecycleActions?.preStop,
    lifecycleActions ? undefined : values.preStopCommand,
  );

  if (!postStart && !preStop) {
    return undefined;
  }

  return {
    ...(postStart ? { postStart } : {}),
    ...(preStop ? { preStop } : {}),
  };
};

const getContainerSecurityContext = (values: CreateWorkloadContainerValues) => {
  if (!values.enableContainerSecurityContext) {
    return undefined;
  }

  const securityContext: Record<string, unknown> = {};
  const seLinuxOptions: Record<string, unknown> = {};
  const capabilitiesAdd = normalizeStringList(values.containerCapabilitiesAdd);
  const capabilitiesDrop = normalizeStringList(
    values.containerCapabilitiesDrop,
  );

  setIfDefined(
    securityContext,
    'privileged',
    values.containerPrivileged || undefined,
  );
  setIfDefined(
    securityContext,
    'runAsNonRoot',
    values.containerRunAsNonRoot || undefined,
  );
  setIfDefined(securityContext, 'runAsUser', values.containerRunAsUser);
  setIfDefined(securityContext, 'runAsGroup', values.containerRunAsGroup);
  setIfDefined(
    securityContext,
    'readOnlyRootFilesystem',
    values.containerReadOnlyRootFilesystem || undefined,
  );
  setIfDefined(
    securityContext,
    'allowPrivilegeEscalation',
    values.containerPrivileged ? true : values.allowPrivilegeEscalation,
  );
  setIfDefined(
    seLinuxOptions,
    'level',
    normalizeName(values.containerSeLinuxLevel),
  );
  setIfDefined(
    seLinuxOptions,
    'role',
    normalizeName(values.containerSeLinuxRole),
  );
  setIfDefined(
    seLinuxOptions,
    'type',
    normalizeName(values.containerSeLinuxType),
  );
  setIfDefined(
    seLinuxOptions,
    'user',
    normalizeName(values.containerSeLinuxUser),
  );

  if (Object.keys(seLinuxOptions).length > 0) {
    securityContext.seLinuxOptions = seLinuxOptions;
  }
  if (capabilitiesAdd.length > 0 || capabilitiesDrop.length > 0) {
    securityContext.capabilities = {
      ...(capabilitiesAdd.length > 0 ? { add: capabilitiesAdd } : {}),
      ...(capabilitiesDrop.length > 0 ? { drop: capabilitiesDrop } : {}),
    };
  }
  if (values.containerSeccompProfileType) {
    securityContext.seccompProfile = {
      type: values.containerSeccompProfileType,
      ...(values.containerSeccompProfileType === 'Localhost'
        ? {
            localhostProfile: normalizeName(
              values.containerSeccompProfileLocalhost,
            ),
          }
        : {}),
    };
  }

  return Object.keys(securityContext).length > 0 ? securityContext : undefined;
};

const normalizeProbeNumber = (value: number | undefined, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const getProbeBaseConfig = (
  probe: ContainerProbeFormValue,
  probeName: ContainerProbeKind,
) => ({
  initialDelaySeconds: normalizeProbeNumber(probe.initialDelaySeconds, 0),
  timeoutSeconds: normalizeProbeNumber(probe.timeoutSeconds, 1),
  periodSeconds: normalizeProbeNumber(probe.periodSeconds, 10),
  successThreshold:
    probeName === 'readiness'
      ? normalizeProbeNumber(probe.successThreshold, 1)
      : 1,
  failureThreshold: normalizeProbeNumber(probe.failureThreshold, 3),
});

const getContainerProbe = (
  values: CreateWorkloadContainerValues,
  probeName: ContainerProbeKind,
) => {
  if (!values.enableHealthCheck) {
    return undefined;
  }

  const probe = values.healthChecks?.[probeName];

  if (!probe?.enabled) {
    return undefined;
  }

  const baseConfig = getProbeBaseConfig(probe, probeName);

  if (probe.handlerType === 'exec') {
    const command = splitCommandText(probe.command);

    return command.length > 0
      ? {
          exec: {
            command,
          },
          ...baseConfig,
        }
      : undefined;
  }

  if (probe.handlerType === 'tcpSocket') {
    return probe.port
      ? {
          tcpSocket: {
            port: probe.port,
          },
          ...baseConfig,
        }
      : undefined;
  }

  const path = normalizeOptionalText(probe.path);

  return path && probe.port
    ? {
        httpGet: {
          scheme: probe.scheme || 'HTTP',
          path,
          port: probe.port,
        },
        ...baseConfig,
      }
    : undefined;
};

const buildPodAffinityTerm = (appLabels: Record<string, string>) => ({
  labelSelector: {
    matchLabels: appLabels,
  },
  topologyKey: 'kubernetes.io/hostname',
});

const getCustomSchedulingTargetLabels = (rule: WorkloadSchedulingCustomRule) =>
  rule.targetLabels && Object.keys(rule.targetLabels).length > 0
    ? rule.targetLabels
    : {
        [DEFAULT_APP_LABEL_KEY]: normalizeName(rule.targetName || rule.target),
      };

const appendCustomSchedulingRule = (
  podSpec: Record<string, unknown>,
  rule: WorkloadSchedulingCustomRule,
) => {
  if (!rule.type || !rule.strategy || !rule.target) {
    return;
  }

  const affinity = (podSpec.affinity || {}) as Record<string, unknown>;
  const affinityKey =
    rule.type === 'affinity' ? 'podAffinity' : 'podAntiAffinity';
  const affinityRule = (affinity[affinityKey] || {}) as Record<
    string,
    unknown[]
  >;
  const podAffinityTerm = buildPodAffinityTerm(
    getCustomSchedulingTargetLabels(rule),
  );

  if (rule.strategy === 'required') {
    affinityRule.requiredDuringSchedulingIgnoredDuringExecution = [
      ...(affinityRule.requiredDuringSchedulingIgnoredDuringExecution || []),
      podAffinityTerm,
    ];
  } else {
    affinityRule.preferredDuringSchedulingIgnoredDuringExecution = [
      ...(affinityRule.preferredDuringSchedulingIgnoredDuringExecution || []),
      {
        weight: 100,
        podAffinityTerm,
      },
    ];
  }

  affinity[affinityKey] = affinityRule;
  podSpec.affinity = affinity;
};

const getWorkloadStepFields = (
  step: number,
  type: API.ClusterWorkloadType,
): (keyof CreateWorkloadFormValues)[] => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 1) {
    const strategyFields: (keyof CreateWorkloadFormValues)[] =
      type === 'Deployment'
        ? ['updateStrategyType', 'maxUnavailable', 'maxSurge']
        : ['updateStrategyType'];
    const schedulingRuleFields: (keyof CreateWorkloadFormValues)[] = [
      'podSchedulingRule',
      'podSchedulingCustomType',
      'podSchedulingCustomStrategy',
      'podSchedulingCustomTarget',
      'podSchedulingCustomRules',
      'terminationGracePeriodSeconds',
      'podAnnotations',
    ];

    return type === 'DaemonSet'
      ? [...strategyFields, ...schedulingRuleFields]
      : ['replicas', ...strategyFields, ...schedulingRuleFields];
  }
  if (step === 2) {
    return ['storageType', 'volumeName', 'mountPath', 'claimName'];
  }
  return ['labels', 'annotations'];
};

const getStorageVolumeMounts = (values: CreateWorkloadFormValues) => {
  const volumeMounts: Record<string, unknown>[] = [];

  if (values.storageType && values.storageType !== 'none' && values.mountPath) {
    volumeMounts.push({
      name: normalizeName(values.volumeName) || 'data',
      mountPath: normalizeName(values.mountPath),
      readOnly: values.readOnly || undefined,
    });
  }

  return volumeMounts;
};

const getPodVolumes = (
  values: CreateWorkloadFormValues,
  containers: CreateWorkloadContainerValues[],
) => {
  const volumes: Record<string, unknown>[] = [];

  if (values.storageType && values.storageType !== 'none') {
    volumes.push({
      name: normalizeName(values.volumeName) || 'data',
      ...(values.storageType === 'persistentVolumeClaim'
        ? {
            persistentVolumeClaim: {
              claimName: normalizeName(values.claimName),
              readOnly: values.readOnly || undefined,
            },
          }
        : { emptyDir: {} }),
    });
  }
  if (containers.some((container) => container.syncHostTimezone)) {
    volumes.push({
      name: 'host-timezone',
      hostPath: {
        path: '/etc/localtime',
        type: 'File',
      },
    });
  }

  return volumes;
};

const getContainerManifest = (
  values: CreateWorkloadContainerValues,
  storageVolumeMounts: Record<string, unknown>[],
) => {
  const ports = getContainerPorts(values);
  const resources = getContainerResources(values);
  const env = getContainerEnv(values);
  const lifecycle = getContainerLifecycle(values);
  const livenessProbe = getContainerProbe(values, 'liveness');
  const readinessProbe = getContainerProbe(values, 'readiness');
  const startupProbe = getContainerProbe(values, 'startup');
  const command = values.enableStartupCommand
    ? splitCommandText(values.startupCommand)
    : [];
  const args = values.enableStartupCommand
    ? splitCommandText(values.startupArgs)
    : [];
  const securityContext = getContainerSecurityContext(values);
  const volumeMounts = [...storageVolumeMounts];

  if (values.syncHostTimezone) {
    volumeMounts.push({
      name: 'host-timezone',
      mountPath: '/etc/localtime',
      readOnly: true,
    });
  }

  return {
    name: normalizeName(values.containerName),
    image: normalizeName(values.image),
    imagePullPolicy: values.imagePullPolicy || 'IfNotPresent',
    ports,
    resources,
    command: command.length > 0 ? command : undefined,
    args: args.length > 0 ? args : undefined,
    env,
    lifecycle,
    readinessProbe,
    livenessProbe,
    startupProbe,
    securityContext,
    volumeMounts: volumeMounts.length > 0 ? volumeMounts : undefined,
  };
};

const buildCreateWorkloadManifest = (
  type: API.ClusterWorkloadType,
  values: CreateWorkloadFormValues,
): Record<string, unknown> => {
  const name = normalizeName(values.name);
  const appLabels = {
    [DEFAULT_APP_LABEL_KEY]: name,
    ...toRecord(values.labels),
  };
  const annotations = {
    ...toRecord(values.annotations),
  };
  const podAnnotations = toRecord(values.podAnnotations);
  const podMetadata: Record<string, unknown> = {
    labels: appLabels,
  };
  const metadata: Record<string, unknown> = {
    name,
    namespace: normalizeName(values.namespace),
    labels: appLabels,
  };
  const configuredContainers =
    values.containers && values.containers.length > 0
      ? values.containers
      : [values];
  const storageVolumeMounts = getStorageVolumeMounts(values);
  const containers = configuredContainers.map((container) =>
    getContainerManifest(container, storageVolumeMounts),
  );
  const volumes = getPodVolumes(values, configuredContainers);
  const podSpec: Record<string, unknown> = {
    containers,
    volumes: volumes.length > 0 ? volumes : undefined,
  };
  if (values.enablePodSecurityContext) {
    const securityContext: Record<string, unknown> = {};
    const seLinuxOptions: Record<string, unknown> = {};

    setIfDefined(
      securityContext,
      'runAsNonRoot',
      values.runAsNonRoot || undefined,
    );
    setIfDefined(securityContext, 'runAsUser', values.runAsUser);
    setIfDefined(securityContext, 'runAsGroup', values.runAsGroup);
    setIfDefined(seLinuxOptions, 'level', normalizeName(values.seLinuxLevel));
    setIfDefined(seLinuxOptions, 'role', normalizeName(values.seLinuxRole));
    setIfDefined(seLinuxOptions, 'type', normalizeName(values.seLinuxType));
    setIfDefined(seLinuxOptions, 'user', normalizeName(values.seLinuxUser));

    if (Object.keys(seLinuxOptions).length > 0) {
      securityContext.seLinuxOptions = seLinuxOptions;
    }
    if (Object.keys(securityContext).length > 0) {
      podSpec.securityContext = securityContext;
    }
  }
  setIfDefined(
    podSpec,
    'terminationGracePeriodSeconds',
    values.terminationGracePeriodSeconds,
  );
  if (values.podSchedulingRule === 'spread') {
    podSpec.affinity = {
      podAntiAffinity: {
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            weight: 100,
            podAffinityTerm: buildPodAffinityTerm(appLabels),
          },
        ],
      },
    };
  }
  if (values.podSchedulingRule === 'centralized') {
    podSpec.affinity = {
      podAffinity: {
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            weight: 100,
            podAffinityTerm: buildPodAffinityTerm(appLabels),
          },
        ],
      },
    };
  }
  if (values.podSchedulingRule === 'custom') {
    const customRules =
      values.podSchedulingCustomRules &&
      values.podSchedulingCustomRules.length > 0
        ? values.podSchedulingCustomRules
        : [
            {
              type: values.podSchedulingCustomType,
              strategy: values.podSchedulingCustomStrategy,
              target: values.podSchedulingCustomTarget,
              targetName: values.podSchedulingCustomTargetName,
              targetLabels: values.podSchedulingCustomTargetLabels,
            },
          ];

    customRules.forEach((rule) => {
      appendCustomSchedulingRule(podSpec, rule);
    });
  }
  const spec: Record<string, unknown> = {
    selector: {
      matchLabels: appLabels,
    },
    template: {
      metadata: podMetadata,
      spec: podSpec,
    },
  };

  if (Object.keys(annotations).length > 0) {
    metadata.annotations = annotations;
    podMetadata.annotations = annotations;
  }
  if (Object.keys(podAnnotations).length > 0) {
    podMetadata.annotations = {
      ...((podMetadata.annotations as Record<string, string> | undefined) ||
        {}),
      ...podAnnotations,
    };
  }
  if (type !== 'DaemonSet') {
    spec.replicas = values.replicas ?? 1;
  }
  if (type === 'StatefulSet') {
    spec.serviceName = name;
  }
  if (type === 'Deployment') {
    spec.strategy =
      values.updateStrategyType === 'Recreate'
        ? {
            type: 'Recreate',
          }
        : {
            type: 'RollingUpdate',
            rollingUpdate: {
              maxUnavailable: normalizeName(values.maxUnavailable) || '25%',
              maxSurge: normalizeName(values.maxSurge) || '25%',
            },
          };
  } else if (type === 'DaemonSet') {
    spec.updateStrategy = {
      type: 'RollingUpdate',
      rollingUpdate: {
        maxUnavailable: normalizeName(values.maxUnavailable) || '25%',
      },
    };
  } else {
    spec.updateStrategy = {
      type: 'RollingUpdate',
    };
  }

  return {
    apiVersion: workloadApiVersions[type],
    kind: workloadKinds[type],
    metadata,
    spec,
  };
};

const buildCreateWorkloadYaml = (
  type: API.ClusterWorkloadType,
  values: CreateWorkloadFormValues,
) => stringify(buildCreateWorkloadManifest(type, values), { indent: 2 });

export {
  buildCreateWorkloadManifest,
  buildCreateWorkloadYaml,
  getInitialCreateWorkloadValues,
  getWorkloadResourceName,
  getWorkloadStepFields,
};
