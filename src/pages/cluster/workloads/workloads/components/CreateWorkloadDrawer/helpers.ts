import { stringify } from 'yaml';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type {
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
  enableLifecycle: false,
  enableStartupCommand: false,
  enableContainerEnv: false,
  containerEnv: [],
  enableContainerSecurityContext: false,
  containerRunAsNonRoot: false,
  containerReadOnlyRootFilesystem: false,
  allowPrivilegeEscalation: true,
  syncHostTimezone: false,
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

const normalizeContainerPortProtocol = (protocol?: string) => {
  if (protocol === 'UDP' || protocol === 'SCTP') {
    return protocol;
  }

  return 'TCP';
};

const getContainerPorts = (values: CreateWorkloadFormValues) => {
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

const getContainerResources = (values: CreateWorkloadFormValues) => {
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

const getContainerEnv = (values: CreateWorkloadFormValues) => {
  if (!values.enableContainerEnv) {
    return undefined;
  }

  const env = (values.containerEnv || []).flatMap((item) => {
    const name = normalizeOptionalText(item.keyName);
    if (!name) {
      return [];
    }

    return [
      {
        name,
        value: item.value,
      },
    ];
  });

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

const getContainerLifecycle = (values: CreateWorkloadFormValues) => {
  if (!values.enableLifecycle) {
    return undefined;
  }

  const postStart = getExecAction(values.postStartCommand);
  const preStop = getExecAction(values.preStopCommand);

  if (!postStart && !preStop) {
    return undefined;
  }

  return {
    ...(postStart ? { postStart } : {}),
    ...(preStop ? { preStop } : {}),
  };
};

const getContainerSecurityContext = (values: CreateWorkloadFormValues) => {
  if (!values.enableContainerSecurityContext) {
    return undefined;
  }

  const securityContext: Record<string, unknown> = {};

  setIfDefined(
    securityContext,
    'runAsNonRoot',
    values.containerRunAsNonRoot || undefined,
  );
  setIfDefined(securityContext, 'runAsUser', values.containerRunAsUser);
  setIfDefined(
    securityContext,
    'readOnlyRootFilesystem',
    values.containerReadOnlyRootFilesystem || undefined,
  );
  setIfDefined(
    securityContext,
    'allowPrivilegeEscalation',
    values.allowPrivilegeEscalation,
  );

  return Object.keys(securityContext).length > 0 ? securityContext : undefined;
};

const getContainerProbe = (values: CreateWorkloadFormValues) => {
  if (
    !values.enableHealthCheck ||
    !values.healthCheckPort ||
    !normalizeOptionalText(values.healthCheckPath)
  ) {
    return undefined;
  }

  return {
    httpGet: {
      path: normalizeOptionalText(values.healthCheckPath),
      port: values.healthCheckPort,
    },
    initialDelaySeconds: 10,
    periodSeconds: 10,
  };
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
      ? ['containerName', 'image', ...strategyFields, ...schedulingRuleFields]
      : [
          'containerName',
          'image',
          'replicas',
          ...strategyFields,
          ...schedulingRuleFields,
        ];
  }
  if (step === 2) {
    return ['storageType', 'volumeName', 'mountPath', 'claimName'];
  }
  return ['labels', 'annotations'];
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
  const ports = getContainerPorts(values);
  const resources = getContainerResources(values);
  const env = getContainerEnv(values);
  const lifecycle = getContainerLifecycle(values);
  const healthProbe = getContainerProbe(values);
  const command = values.enableStartupCommand
    ? splitCommandText(values.startupCommand)
    : [];
  const args = values.enableStartupCommand
    ? splitCommandText(values.startupArgs)
    : [];
  const securityContext = getContainerSecurityContext(values);
  const volumeMounts: Record<string, unknown>[] = [];
  const volumes: Record<string, unknown>[] = [];

  if (values.storageType && values.storageType !== 'none' && values.mountPath) {
    volumeMounts.push({
      name: normalizeName(values.volumeName) || 'data',
      mountPath: normalizeName(values.mountPath),
      readOnly: values.readOnly || undefined,
    });
  }
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
  if (values.syncHostTimezone) {
    volumeMounts.push({
      name: 'host-timezone',
      mountPath: '/etc/localtime',
      readOnly: true,
    });
    volumes.push({
      name: 'host-timezone',
      hostPath: {
        path: '/etc/localtime',
        type: 'File',
      },
    });
  }
  const container = {
    name: normalizeName(values.containerName),
    image: normalizeName(values.image),
    imagePullPolicy: values.imagePullPolicy || 'IfNotPresent',
    ports,
    resources,
    command: command.length > 0 ? command : undefined,
    args: args.length > 0 ? args : undefined,
    env,
    lifecycle,
    readinessProbe: healthProbe,
    livenessProbe: healthProbe,
    securityContext,
    volumeMounts: volumeMounts.length > 0 ? volumeMounts : undefined,
  };
  const podSpec: Record<string, unknown> = {
    containers: [container],
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
