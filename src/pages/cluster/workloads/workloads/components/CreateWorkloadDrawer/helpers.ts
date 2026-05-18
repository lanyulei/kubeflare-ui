import { stringify } from 'yaml';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type { CreateWorkloadFormValues } from './types';

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
  podSchedulingRule: 'default',
  imagePullPolicy: 'IfNotPresent',
  protocol: 'TCP',
  storageType: 'none',
  volumeName: 'data',
  labels: [],
  annotations: [],
});

const normalizeName = (value?: string) => value?.trim() || '';

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

const buildPodAffinityTerm = (appLabels: Record<string, string>) => ({
  labelSelector: {
    matchLabels: appLabels,
  },
  topologyKey: 'kubernetes.io/hostname',
});

const buildPodAffinityRule = (
  labels: Record<string, string>,
  strategy?: CreateWorkloadFormValues['podSchedulingCustomStrategy'],
) => {
  const podAffinityTerm = buildPodAffinityTerm(labels);

  if (strategy === 'required') {
    return {
      requiredDuringSchedulingIgnoredDuringExecution: [podAffinityTerm],
    };
  }

  return {
    preferredDuringSchedulingIgnoredDuringExecution: [
      {
        weight: 100,
        podAffinityTerm,
      },
    ],
  };
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
  const podMetadata: Record<string, unknown> = {
    labels: appLabels,
  };
  const metadata: Record<string, unknown> = {
    name,
    namespace: normalizeName(values.namespace),
    labels: appLabels,
  };
  const ports = values.containerPort
    ? [
        {
          containerPort: values.containerPort,
          protocol: values.protocol || 'TCP',
        },
      ]
    : undefined;
  const volumeMounts =
    values.storageType && values.storageType !== 'none' && values.mountPath
      ? [
          {
            name: normalizeName(values.volumeName) || 'data',
            mountPath: normalizeName(values.mountPath),
            readOnly: values.readOnly || undefined,
          },
        ]
      : undefined;
  const volumes =
    values.storageType && values.storageType !== 'none'
      ? [
          {
            name: normalizeName(values.volumeName) || 'data',
            ...(values.storageType === 'persistentVolumeClaim'
              ? {
                  persistentVolumeClaim: {
                    claimName: normalizeName(values.claimName),
                    readOnly: values.readOnly || undefined,
                  },
                }
              : { emptyDir: {} }),
          },
        ]
      : undefined;
  const container = {
    name: normalizeName(values.containerName),
    image: normalizeName(values.image),
    imagePullPolicy: values.imagePullPolicy || 'IfNotPresent',
    ports,
    volumeMounts,
  };
  const podSpec: Record<string, unknown> = {
    containers: [container],
    volumes,
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
  if (
    values.podSchedulingRule === 'custom' &&
    values.podSchedulingCustomType &&
    values.podSchedulingCustomStrategy &&
    values.podSchedulingCustomTarget
  ) {
    const targetLabels =
      values.podSchedulingCustomTargetLabels &&
      Object.keys(values.podSchedulingCustomTargetLabels).length > 0
        ? values.podSchedulingCustomTargetLabels
        : {
            [DEFAULT_APP_LABEL_KEY]: normalizeName(
              values.podSchedulingCustomTargetName ||
                values.podSchedulingCustomTarget,
            ),
          };
    const affinityRule = buildPodAffinityRule(
      targetLabels,
      values.podSchedulingCustomStrategy,
    );

    podSpec.affinity =
      values.podSchedulingCustomType === 'affinity'
        ? {
            podAffinity: affinityRule,
          }
        : {
            podAntiAffinity: affinityRule,
          };
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
