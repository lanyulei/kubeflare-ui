import {
  buildCreateWorkloadManifest,
  getInitialCreateWorkloadValues,
} from '../../../components/CreateWorkloadDrawer/helpers';
import type {
  ContainerActionFormValue,
  ContainerEnvItem,
  ContainerProbeFormValue,
  ContainerSeccompProfileType,
  ContainerType,
  CreateWorkloadContainerValues,
  CreateWorkloadFormValues,
  WorkloadContainerMountItem,
  WorkloadMountMode,
  WorkloadSchedulingCustomRule,
  WorkloadStorageCategory,
  WorkloadStorageConfigItem,
  WorkloadStorageKeyPathItem,
} from '../../../components/CreateWorkloadDrawer/types';

const DEFAULT_APP_LABEL_KEY = 'app';
const HOST_TIME_VOLUME_NAME = 'host-time';

type ManifestRecord = Record<string, unknown>;

type ContainerManifestPair = {
  manifest: ManifestRecord;
  values: CreateWorkloadContainerValues;
};

const getRecordValue = (value: unknown): ManifestRecord | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as ManifestRecord)
    : undefined;

const getRecordArray = (value: unknown): ManifestRecord[] =>
  Array.isArray(value)
    ? value.filter((item): item is ManifestRecord =>
        Boolean(getRecordValue(item)),
      )
    : [];

const getStringValue = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const getNumberValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }
  return undefined;
};

const getIntOrStringTextValue = (value: unknown, fallback: string) => {
  const stringValue = getStringValue(value);
  if (stringValue) {
    return stringValue;
  }

  const numberValue = getNumberValue(value);
  return numberValue === undefined ? fallback : String(numberValue);
};

const getBooleanValue = (value: unknown) =>
  typeof value === 'boolean' ? value : undefined;

const getStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

const createId = (prefix: string, index: number) => `${prefix}-${index}`;

const cloneManifest = (manifest: ManifestRecord): ManifestRecord =>
  JSON.parse(JSON.stringify(manifest));

const ensureRecordField = (target: ManifestRecord, key: string) => {
  const current = getRecordValue(target[key]);
  if (current) {
    return current;
  }

  const next: ManifestRecord = {};
  target[key] = next;
  return next;
};

const deleteIfEmpty = (target: ManifestRecord, key: string) => {
  const value = getRecordValue(target[key]);
  if (value && Object.keys(value).length === 0) {
    delete target[key];
  }
};

const parseCpuValue = (value: unknown) => {
  const text = getStringValue(value);
  if (!text) {
    return getNumberValue(value);
  }
  if (text.endsWith('m')) {
    const millicores = Number(text.slice(0, -1));
    return Number.isFinite(millicores) ? millicores / 1000 : undefined;
  }
  return getNumberValue(text);
};

const parseMemoryMiValue = (value: unknown) => {
  const text = getStringValue(value);
  if (!text) {
    return getNumberValue(value);
  }

  const matched = text.match(/^(\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti|K|M|G|T)?$/);
  if (!matched) {
    return undefined;
  }

  const numberValue = Number(matched[1]);
  if (!Number.isFinite(numberValue)) {
    return undefined;
  }

  const unit = matched[2];
  if (unit === 'Gi' || unit === 'G') {
    return numberValue * 1024;
  }
  if (unit === 'Ti' || unit === 'T') {
    return numberValue * 1024 * 1024;
  }
  if (unit === 'Ki' || unit === 'K') {
    return numberValue / 1024;
  }
  return numberValue;
};

const parseStorageGiValue = (value: unknown) => {
  const text = getStringValue(value);
  if (!text) {
    return getNumberValue(value);
  }

  const matched = text.match(/^(\d+(?:\.\d+)?)(Mi|Gi|Ti|M|G|T)?$/);
  if (!matched) {
    return undefined;
  }

  const numberValue = Number(matched[1]);
  if (!Number.isFinite(numberValue)) {
    return undefined;
  }

  const unit = matched[2];
  if (unit === 'Mi' || unit === 'M') {
    return numberValue / 1024;
  }
  if (unit === 'Ti' || unit === 'T') {
    return numberValue * 1024;
  }
  return numberValue;
};

const getManifestMetadata = (manifest: ManifestRecord) =>
  getRecordValue(manifest.metadata) || {};

const getManifestSpec = (manifest: ManifestRecord) =>
  getRecordValue(manifest.spec) || {};

const getManifestTemplate = (manifest: ManifestRecord) =>
  getRecordValue(getManifestSpec(manifest).template) || {};

const getManifestTemplateMetadata = (manifest: ManifestRecord) =>
  getRecordValue(getManifestTemplate(manifest).metadata) || {};

const getManifestPodSpec = (manifest: ManifestRecord) =>
  getRecordValue(getManifestTemplate(manifest).spec) || {};

const toKeyValueItems = (record?: ManifestRecord) =>
  Object.entries(record || {}).map(([keyName, value], index) => ({
    id: createId('item', index),
    keyName,
    value: typeof value === 'string' ? value : String(value ?? ''),
  }));

const parseActionValue = (
  value: unknown,
): ContainerActionFormValue | undefined => {
  const action = getRecordValue(value);
  if (!action) {
    return undefined;
  }

  const httpGet = getRecordValue(action.httpGet);
  if (httpGet) {
    return {
      enabled: true,
      handlerType: 'httpGet',
      scheme: getStringValue(httpGet.scheme) === 'HTTPS' ? 'HTTPS' : 'HTTP',
      path: getStringValue(httpGet.path) || '/',
      port: getNumberValue(httpGet.port) || 80,
    };
  }

  const exec = getRecordValue(action.exec);
  if (exec) {
    return {
      enabled: true,
      handlerType: 'exec',
      command: getStringArray(exec.command).join(', '),
    };
  }

  const tcpSocket = getRecordValue(action.tcpSocket);
  if (tcpSocket) {
    return {
      enabled: true,
      handlerType: 'tcpSocket',
      port: getNumberValue(tcpSocket.port) || 80,
    };
  }

  return undefined;
};

const parseProbeValue = (
  value: unknown,
): ContainerProbeFormValue | undefined => {
  const probe = getRecordValue(value);
  const action = parseActionValue(probe);
  if (!probe || !action) {
    return undefined;
  }

  return {
    ...action,
    initialDelaySeconds: getNumberValue(probe.initialDelaySeconds) ?? 0,
    timeoutSeconds: getNumberValue(probe.timeoutSeconds) ?? 1,
    periodSeconds: getNumberValue(probe.periodSeconds) ?? 10,
    successThreshold: getNumberValue(probe.successThreshold) ?? 1,
    failureThreshold: getNumberValue(probe.failureThreshold) ?? 3,
  };
};

const parseEnvItems = (value: unknown): ContainerEnvItem[] =>
  getRecordArray(value).map((item, index) => {
    const valueFrom = getRecordValue(item.valueFrom);
    const configMapKeyRef = getRecordValue(valueFrom?.configMapKeyRef);
    const secretKeyRef = getRecordValue(valueFrom?.secretKeyRef);

    if (configMapKeyRef || secretKeyRef) {
      const source = configMapKeyRef || secretKeyRef || {};
      const sourceType = configMapKeyRef ? 'configMap' : 'secret';
      const resourceKey = getStringValue(source.key) || '';

      return {
        id: createId('env', index),
        sourceType,
        keyName: getStringValue(item.name) || resourceKey,
        resourceName: getStringValue(source.name),
        resourceKey,
      };
    }

    return {
      id: createId('env', index),
      sourceType: 'custom',
      keyName: getStringValue(item.name) || '',
      value: getStringValue(item.value) || '',
    };
  });

const isSeccompProfileType = (
  value?: string,
): value is ContainerSeccompProfileType =>
  value === 'RuntimeDefault' || value === 'Localhost' || value === 'Unconfined';

const parseContainerValues = (
  manifest: ManifestRecord,
  containerType: ContainerType,
  index: number,
): CreateWorkloadContainerValues => {
  const resources = getRecordValue(manifest.resources) || {};
  const requests = getRecordValue(resources.requests) || {};
  const limits = getRecordValue(resources.limits) || {};
  const lifecycle = getRecordValue(manifest.lifecycle) || {};
  const postStart = parseActionValue(lifecycle.postStart);
  const preStop = parseActionValue(lifecycle.preStop);
  const healthChecks = {
    liveness: parseProbeValue(manifest.livenessProbe),
    readiness: parseProbeValue(manifest.readinessProbe),
    startup: parseProbeValue(manifest.startupProbe),
  };
  const command = getStringArray(manifest.command);
  const args = getStringArray(manifest.args);
  const env = parseEnvItems(manifest.env);
  const securityContext = getRecordValue(manifest.securityContext) || {};
  const seLinuxOptions = getRecordValue(securityContext.seLinuxOptions) || {};
  const capabilities = getRecordValue(securityContext.capabilities) || {};
  const seccompProfile = getRecordValue(securityContext.seccompProfile) || {};
  const seccompType = getStringValue(seccompProfile.type);
  const volumeMounts = getRecordArray(manifest.volumeMounts);

  return {
    id: createId(`${containerType}-container`, index),
    containerName: getStringValue(manifest.name),
    containerType,
    image: getStringValue(manifest.image),
    imagePullPolicy: getStringValue(manifest.imagePullPolicy) || 'IfNotPresent',
    cpuRequest: parseCpuValue(requests.cpu),
    cpuLimit: parseCpuValue(limits.cpu),
    memoryRequest: parseMemoryMiValue(requests.memory),
    memoryLimit: parseMemoryMiValue(limits.memory),
    containerPorts: getRecordArray(manifest.ports).map((port, portIndex) => ({
      protocol: getStringValue(port.protocol) || 'TCP',
      name: getStringValue(port.name) || `port-${portIndex}`,
      containerPort: getNumberValue(port.containerPort),
    })),
    enableHealthCheck: Object.values(healthChecks).some(Boolean),
    healthChecks,
    enableLifecycle: Boolean(postStart || preStop),
    lifecycleActions: {
      postStart,
      preStop,
    },
    enableStartupCommand: command.length > 0 || args.length > 0,
    startupCommand: command.join(', '),
    startupArgs: args.join(', '),
    enableContainerEnv: env.length > 0,
    containerEnv: env,
    enableContainerSecurityContext: Object.keys(securityContext).length > 0,
    containerPrivileged: getBooleanValue(securityContext.privileged) || false,
    containerRunAsNonRoot:
      getBooleanValue(securityContext.runAsNonRoot) || false,
    containerRunAsUser: getNumberValue(securityContext.runAsUser),
    containerRunAsGroup: getNumberValue(securityContext.runAsGroup),
    containerReadOnlyRootFilesystem:
      getBooleanValue(securityContext.readOnlyRootFilesystem) || false,
    allowPrivilegeEscalation:
      getBooleanValue(securityContext.allowPrivilegeEscalation) || false,
    containerSeLinuxLevel: getStringValue(seLinuxOptions.level),
    containerSeLinuxRole: getStringValue(seLinuxOptions.role),
    containerSeLinuxType: getStringValue(seLinuxOptions.type),
    containerSeLinuxUser: getStringValue(seLinuxOptions.user),
    containerCapabilitiesAdd: getStringArray(capabilities.add),
    containerCapabilitiesDrop: getStringArray(capabilities.drop),
    containerSeccompProfileType: isSeccompProfileType(seccompType)
      ? seccompType
      : undefined,
    containerSeccompProfileLocalhost: getStringValue(
      seccompProfile.localhostProfile,
    ),
    syncHostTimezone: volumeMounts.some(
      (mount) =>
        mount.name === HOST_TIME_VOLUME_NAME ||
        mount.mountPath === '/etc/localtime',
    ),
    protocol: 'TCP',
  };
};

const getContainerPairs = (manifest: ManifestRecord) => {
  const podSpec = getManifestPodSpec(manifest);
  const initContainers = getRecordArray(podSpec.initContainers);
  const containers = getRecordArray(podSpec.containers);

  return [
    ...initContainers.map((container, index) => ({
      manifest: container,
      values: parseContainerValues(container, 'init', index),
    })),
    ...containers.map((container, index) => ({
      manifest: container,
      values: parseContainerValues(container, 'worker', index),
    })),
  ];
};

const getContainerMounts = (
  volumeName: string,
  storageCategory: WorkloadStorageCategory,
  containers: ContainerManifestPair[],
): WorkloadContainerMountItem[] =>
  containers.flatMap((container, index) => {
    const volumeMount = getRecordArray(container.manifest.volumeMounts).find(
      (mount) => mount.name === volumeName,
    );

    if (!volumeMount) {
      return [];
    }

    const mountMode: WorkloadMountMode =
      storageCategory === 'config' || volumeMount.readOnly
        ? 'readOnly'
        : 'readWrite';

    return [
      {
        id: createId(`mount-${volumeName}`, index),
        containerId: container.values.id,
        containerName: container.values.containerName,
        mountMode,
        mountPath: getStringValue(volumeMount.mountPath) || '',
        subPath: getStringValue(volumeMount.subPath),
      },
    ];
  });

const parseSpecificKeyPaths = (items: unknown): WorkloadStorageKeyPathItem[] =>
  getRecordArray(items).map((item, index) => ({
    id: createId('key-path', index),
    keyName: getStringValue(item.key),
    path: getStringValue(item.path) || '',
  }));

const parseVolumeStorageItems = (
  podSpec: ManifestRecord,
  containers: ContainerManifestPair[],
): WorkloadStorageConfigItem[] =>
  getRecordArray(podSpec.volumes).flatMap<WorkloadStorageConfigItem>(
    (volume, index) => {
      const volumeName = getStringValue(volume.name);
      if (!volumeName || volumeName === HOST_TIME_VOLUME_NAME) {
        return [];
      }

      const persistentVolumeClaim = getRecordValue(
        volume.persistentVolumeClaim,
      );
      if (persistentVolumeClaim) {
        return [
          {
            id: createId('storage', index),
            storageCategory: 'volume',
            storageType: 'persistentVolumeClaim',
            volumeType: 'persistentVolumeClaim',
            claimName: getStringValue(persistentVolumeClaim.claimName),
            volumeName,
            containerMounts: getContainerMounts(
              volumeName,
              'volume',
              containers,
            ),
          },
        ];
      }

      const emptyDir = getRecordValue(volume.emptyDir);
      if (emptyDir) {
        return [
          {
            id: createId('storage', index),
            storageCategory: 'volume',
            storageType: 'emptyDir',
            volumeType: 'emptyDir',
            volumeName,
            emptyDirSizeLimit: getStringValue(emptyDir.sizeLimit) || '200Mi',
            containerMounts: getContainerMounts(
              volumeName,
              'volume',
              containers,
            ),
          },
        ];
      }

      const hostPath = getRecordValue(volume.hostPath);
      if (hostPath) {
        return [
          {
            id: createId('storage', index),
            storageCategory: 'volume',
            storageType: 'hostPath',
            volumeType: 'hostPath',
            volumeName,
            hostPath: getStringValue(hostPath.path),
            containerMounts: getContainerMounts(
              volumeName,
              'volume',
              containers,
            ),
          },
        ];
      }

      const configMap = getRecordValue(volume.configMap);
      if (configMap) {
        const specificKeyPaths = parseSpecificKeyPaths(configMap.items);
        return [
          {
            id: createId('storage', index),
            storageCategory: 'config',
            storageType: 'configMap',
            configResourceType: 'configMap',
            volumeName,
            configResourceName: getStringValue(configMap.name),
            selectSpecificKeys: specificKeyPaths.length > 0,
            specificKeyPaths,
            containerMounts: getContainerMounts(
              volumeName,
              'config',
              containers,
            ),
          },
        ];
      }

      const secret = getRecordValue(volume.secret);
      if (secret) {
        const specificKeyPaths = parseSpecificKeyPaths(secret.items);
        return [
          {
            id: createId('storage', index),
            storageCategory: 'config',
            storageType: 'secret',
            configResourceType: 'secret',
            volumeName,
            configResourceName: getStringValue(secret.secretName),
            selectSpecificKeys: specificKeyPaths.length > 0,
            specificKeyPaths,
            containerMounts: getContainerMounts(
              volumeName,
              'config',
              containers,
            ),
          },
        ];
      }

      return [];
    },
  );

const parseVolumeClaimTemplateItems = (
  spec: ManifestRecord,
  containers: ContainerManifestPair[],
): WorkloadStorageConfigItem[] =>
  getRecordArray(spec.volumeClaimTemplates).flatMap((template, index) => {
    const metadata = getRecordValue(template.metadata) || {};
    const templateSpec = getRecordValue(template.spec) || {};
    const resources = getRecordValue(templateSpec.resources) || {};
    const requests = getRecordValue(resources.requests) || {};
    const volumeName = getStringValue(metadata.name);

    if (!volumeName) {
      return [];
    }

    return [
      {
        id: createId('pvc-template', index),
        storageCategory: 'volume',
        storageType: 'volumeClaimTemplate',
        volumeType: 'persistentVolumeClaim',
        pvcNamePrefix: volumeName,
        pvcStorageClassName: getStringValue(templateSpec.storageClassName),
        pvcAccessModes: getStringArray(templateSpec.accessModes),
        pvcSizeGi: parseStorageGiValue(requests.storage) || 10,
        containerMounts: getContainerMounts(volumeName, 'volume', containers),
      },
    ];
  });

const getStorageItemsFromManifest = (
  type: API.ClusterWorkloadType,
  manifest: ManifestRecord,
  containers: ContainerManifestPair[],
) => [
  ...parseVolumeStorageItems(getManifestPodSpec(manifest), containers),
  ...(type === 'StatefulSet'
    ? parseVolumeClaimTemplateItems(getManifestSpec(manifest), containers)
    : []),
];

const recordMatches = (
  first?: ManifestRecord,
  second?: ManifestRecord,
): boolean => {
  const firstEntries = Object.entries(first || {});
  const secondEntries = Object.entries(second || {});

  if (
    firstEntries.length === 0 ||
    firstEntries.length !== secondEntries.length
  ) {
    return false;
  }

  return firstEntries.every(([key, value]) => second?.[key] === value);
};

const getTermLabels = (term: unknown) => {
  const termRecord = getRecordValue(term) || {};
  const selector = getRecordValue(termRecord.labelSelector) || {};
  return getRecordValue(selector.matchLabels);
};

const getPreferredTerms = (value: unknown) =>
  getRecordArray(value)
    .map((item) => item.podAffinityTerm)
    .filter(Boolean);

const getSchedulingRules = (
  affinityValue: unknown,
  namespace?: string,
): WorkloadSchedulingCustomRule[] => {
  const affinity = getRecordValue(affinityValue) || {};
  const podAffinity = getRecordValue(affinity.podAffinity) || {};
  const podAntiAffinity = getRecordValue(affinity.podAntiAffinity) || {};
  const groups = [
    {
      type: 'affinity' as const,
      strategy: 'preferred' as const,
      terms: getPreferredTerms(
        podAffinity.preferredDuringSchedulingIgnoredDuringExecution,
      ),
    },
    {
      type: 'affinity' as const,
      strategy: 'required' as const,
      terms: getRecordArray(
        podAffinity.requiredDuringSchedulingIgnoredDuringExecution,
      ),
    },
    {
      type: 'antiAffinity' as const,
      strategy: 'preferred' as const,
      terms: getPreferredTerms(
        podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution,
      ),
    },
    {
      type: 'antiAffinity' as const,
      strategy: 'required' as const,
      terms: getRecordArray(
        podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution,
      ),
    },
  ];

  return groups.flatMap((group) =>
    group.terms.flatMap((term) => {
      const targetLabels = getTermLabels(term);
      if (!targetLabels) {
        return [];
      }

      const targetName = getStringValue(targetLabels[DEFAULT_APP_LABEL_KEY]);
      return [
        {
          type: group.type,
          strategy: group.strategy,
          target: targetName
            ? `${namespace || 'default'}/${targetName}`
            : JSON.stringify(targetLabels),
          targetName,
          targetLabels: targetLabels as Record<string, string>,
        },
      ];
    }),
  );
};

const getSchedulingValues = (
  manifest: ManifestRecord,
): Pick<
  CreateWorkloadFormValues,
  'podSchedulingRule' | 'podSchedulingCustomRules'
> => {
  const spec = getManifestSpec(manifest);
  const podSpec = getManifestPodSpec(manifest);
  const affinity = getRecordValue(podSpec.affinity);
  const podAffinity = getRecordValue(affinity?.podAffinity) || {};
  const podAntiAffinity = getRecordValue(affinity?.podAntiAffinity) || {};
  const templateLabels =
    getRecordValue(getManifestTemplateMetadata(manifest).labels) ||
    getRecordValue(getRecordValue(spec.selector)?.matchLabels);
  const namespace = getStringValue(getManifestMetadata(manifest).namespace);
  const affinityPreferred = getPreferredTerms(
    podAffinity.preferredDuringSchedulingIgnoredDuringExecution,
  );
  const antiAffinityPreferred = getPreferredTerms(
    podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution,
  );
  const hasRequired =
    getRecordArray(podAffinity.requiredDuringSchedulingIgnoredDuringExecution)
      .length > 0 ||
    getRecordArray(
      podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution,
    ).length > 0;

  if (
    !hasRequired &&
    affinityPreferred.length === 0 &&
    antiAffinityPreferred.length > 0 &&
    antiAffinityPreferred.every((term) =>
      recordMatches(getTermLabels(term), templateLabels),
    )
  ) {
    return {
      podSchedulingRule: 'spread',
      podSchedulingCustomRules: [],
    };
  }

  if (
    !hasRequired &&
    antiAffinityPreferred.length === 0 &&
    affinityPreferred.length > 0 &&
    affinityPreferred.every((term) =>
      recordMatches(getTermLabels(term), templateLabels),
    )
  ) {
    return {
      podSchedulingRule: 'centralized',
      podSchedulingCustomRules: [],
    };
  }

  const customRules = getSchedulingRules(affinity, namespace);
  return customRules.length > 0
    ? {
        podSchedulingRule: 'custom',
        podSchedulingCustomRules: customRules,
      }
    : {
        podSchedulingRule: 'default',
        podSchedulingCustomRules: [],
      };
};

const getUpdateStrategyValues = (
  type: API.ClusterWorkloadType,
  spec: ManifestRecord,
): Partial<CreateWorkloadFormValues> => {
  const strategy =
    type === 'Deployment'
      ? getRecordValue(spec.strategy) || {}
      : getRecordValue(spec.updateStrategy) || {};
  const rollingUpdate = getRecordValue(strategy.rollingUpdate) || {};
  const strategyType = getStringValue(strategy.type);

  if (type === 'Deployment') {
    return {
      updateStrategyType:
        strategyType === 'Recreate' ? 'Recreate' : 'RollingUpdate',
      maxUnavailable: getIntOrStringTextValue(
        rollingUpdate.maxUnavailable,
        '25%',
      ),
      maxSurge: getIntOrStringTextValue(rollingUpdate.maxSurge, '25%'),
    };
  }

  if (type === 'StatefulSet') {
    return {
      updateStrategyType:
        strategyType === 'OnDelete' ? 'OnDelete' : 'RollingUpdate',
      updatePartition: getNumberValue(rollingUpdate.partition) ?? 0,
    };
  }

  return {
    updateStrategyType:
      strategyType === 'OnDelete' ? 'OnDelete' : 'RollingUpdate',
    maxUnavailable: getIntOrStringTextValue(
      rollingUpdate.maxUnavailable,
      '25%',
    ),
    minReadySeconds: getNumberValue(spec.minReadySeconds) ?? 0,
  };
};

const getWorkloadSettingsFormValues = (
  type: API.ClusterWorkloadType,
  manifest: ManifestRecord,
): CreateWorkloadFormValues => {
  const metadata = getManifestMetadata(manifest);
  const spec = getManifestSpec(manifest);
  const podSpec = getManifestPodSpec(manifest);
  const containers = getContainerPairs(manifest);
  const namespace = getStringValue(metadata.namespace);
  const initialValues = getInitialCreateWorkloadValues(type, namespace);
  const terminationGracePeriodSeconds = getNumberValue(
    podSpec.terminationGracePeriodSeconds,
  );

  return {
    ...initialValues,
    name: getStringValue(metadata.name),
    namespace,
    replicas:
      type === 'DaemonSet'
        ? undefined
        : (getNumberValue(spec.replicas) ?? initialValues.replicas),
    ...getUpdateStrategyValues(type, spec),
    containers: containers.map((container) => container.values),
    storageItems: getStorageItemsFromManifest(type, manifest, containers),
    enablePodGracefulTermination: terminationGracePeriodSeconds !== undefined,
    terminationGracePeriodSeconds:
      terminationGracePeriodSeconds ??
      initialValues.terminationGracePeriodSeconds,
    labels: toKeyValueItems(getRecordValue(metadata.labels)),
    annotations: toKeyValueItems(getRecordValue(metadata.annotations)),
    ...getSchedulingValues(manifest),
  };
};

const getVolumeNames = (volumes: ManifestRecord[]) =>
  volumes.flatMap((volume) => {
    const name = getStringValue(volume.name);
    return name ? [name] : [];
  });

const getSupportedStorageVolumeNames = (manifest: ManifestRecord) => {
  const spec = getManifestSpec(manifest);
  const podSpec = getManifestPodSpec(manifest);
  const volumeNames = getRecordArray(podSpec.volumes).flatMap((volume) => {
    const name = getStringValue(volume.name);
    if (
      !name ||
      !(
        volume.persistentVolumeClaim ||
        volume.emptyDir ||
        volume.hostPath ||
        volume.configMap ||
        volume.secret
      )
    ) {
      return [];
    }
    return [name];
  });
  const templateNames = getRecordArray(spec.volumeClaimTemplates).flatMap(
    (template) => {
      const name = getStringValue(getRecordValue(template.metadata)?.name);
      return name ? [name] : [];
    },
  );

  return new Set([...volumeNames, ...templateNames, HOST_TIME_VOLUME_NAME]);
};

const cleanUndefinedFields = (record: ManifestRecord) => {
  Object.keys(record).forEach((key) => {
    if (record[key] === undefined) {
      delete record[key];
    }
  });
  return record;
};

const isUnsupportedEnvValueFrom = (env: ManifestRecord) => {
  const valueFrom = getRecordValue(env.valueFrom);
  if (!valueFrom) {
    return false;
  }

  return !valueFrom.configMapKeyRef && !valueFrom.secretKeyRef;
};

const mergeEnvItems = (baseEnvValue: unknown, generatedEnvValue: unknown) => {
  if (!Array.isArray(generatedEnvValue)) {
    return undefined;
  }

  const baseEnv = getRecordArray(baseEnvValue);
  const generatedEnv = getRecordArray(generatedEnvValue);
  const generatedNames = new Set(
    generatedEnv.flatMap((env) => {
      const name = getStringValue(env.name);
      return name ? [name] : [];
    }),
  );
  const preservedUnsupportedEnv = baseEnv.filter((env) => {
    const name = getStringValue(env.name);
    return name && !generatedNames.has(name) && isUnsupportedEnvValueFrom(env);
  });
  const mergedGeneratedEnv = generatedEnv.map((env) => {
    const name = getStringValue(env.name);
    const baseItem = baseEnv.find((item) => item.name === name);

    if (
      baseItem &&
      isUnsupportedEnvValueFrom(baseItem) &&
      env.value === '' &&
      !env.valueFrom
    ) {
      return baseItem;
    }

    return env;
  });

  const nextEnv = [...preservedUnsupportedEnv, ...mergedGeneratedEnv];
  return nextEnv.length > 0 ? nextEnv : undefined;
};

const hasUnsupportedActionConfig = (actionValue: unknown) => {
  const action = getRecordValue(actionValue);
  if (!action) {
    return false;
  }

  const httpGet = getRecordValue(action.httpGet);
  if (httpGet) {
    return (
      typeof httpGet.port === 'string' ||
      'host' in httpGet ||
      'httpHeaders' in httpGet
    );
  }

  const tcpSocket = getRecordValue(action.tcpSocket);
  if (tcpSocket) {
    return typeof tcpSocket.port === 'string' || 'host' in tcpSocket;
  }

  return false;
};

const preserveUnsupportedActionField = (
  baseContainer: ManifestRecord | undefined,
  generatedContainer: ManifestRecord,
  targetContainer: ManifestRecord,
  fieldName: string,
) => {
  if (
    generatedContainer[fieldName] &&
    hasUnsupportedActionConfig(baseContainer?.[fieldName])
  ) {
    targetContainer[fieldName] = baseContainer?.[fieldName];
  }
};

const preserveUnsupportedLifecycleActions = (
  baseContainer: ManifestRecord | undefined,
  generatedContainer: ManifestRecord,
  targetContainer: ManifestRecord,
) => {
  const baseLifecycle = getRecordValue(baseContainer?.lifecycle);
  const generatedLifecycle = getRecordValue(generatedContainer.lifecycle);
  if (!baseLifecycle || !generatedLifecycle) {
    return;
  }

  const nextLifecycle = getRecordValue(targetContainer.lifecycle) || {};
  ['postStart', 'preStop'].forEach((actionName) => {
    if (
      generatedLifecycle[actionName] &&
      hasUnsupportedActionConfig(baseLifecycle[actionName])
    ) {
      nextLifecycle[actionName] = baseLifecycle[actionName];
    }
  });

  if (Object.keys(nextLifecycle).length > 0) {
    targetContainer.lifecycle = nextLifecycle;
  }
};

const mergeVolumeMounts = (
  baseMountsValue: unknown,
  generatedMountsValue: unknown,
  managedVolumeNames: Set<string>,
) => {
  const generatedMounts = getRecordArray(generatedMountsValue);
  const preservedMounts = getRecordArray(baseMountsValue).filter((mount) => {
    const name = getStringValue(mount.name);
    return name && !managedVolumeNames.has(name);
  });

  return [...preservedMounts, ...generatedMounts];
};

const mergeContainerManifest = (
  baseContainer: ManifestRecord | undefined,
  generatedContainer: ManifestRecord,
  managedVolumeNames: Set<string>,
) => {
  const nextContainer = {
    ...(baseContainer || {}),
    ...generatedContainer,
  };
  const volumeMounts = mergeVolumeMounts(
    baseContainer?.volumeMounts,
    generatedContainer.volumeMounts,
    managedVolumeNames,
  );
  const env = mergeEnvItems(baseContainer?.env, generatedContainer.env);

  if (volumeMounts.length > 0) {
    nextContainer.volumeMounts = volumeMounts;
  } else {
    delete nextContainer.volumeMounts;
  }
  if (env) {
    nextContainer.env = env;
  } else {
    delete nextContainer.env;
  }
  preserveUnsupportedActionField(
    baseContainer,
    generatedContainer,
    nextContainer,
    'livenessProbe',
  );
  preserveUnsupportedActionField(
    baseContainer,
    generatedContainer,
    nextContainer,
    'readinessProbe',
  );
  preserveUnsupportedActionField(
    baseContainer,
    generatedContainer,
    nextContainer,
    'startupProbe',
  );
  preserveUnsupportedLifecycleActions(
    baseContainer,
    generatedContainer,
    nextContainer,
  );

  return cleanUndefinedFields(nextContainer);
};

const mergeContainerList = (
  baseContainersValue: unknown,
  generatedContainersValue: unknown,
  managedVolumeNames: Set<string>,
) => {
  const baseContainers = getRecordArray(baseContainersValue);
  const generatedContainers = getRecordArray(generatedContainersValue);

  return generatedContainers.map((container) =>
    mergeContainerManifest(
      baseContainers.find((item) => item.name === container.name),
      container,
      managedVolumeNames,
    ),
  );
};

const mergeVolumes = (
  baseVolumesValue: unknown,
  generatedVolumesValue: unknown,
  replacedVolumeNames: Set<string>,
) => {
  const generatedVolumes = getRecordArray(generatedVolumesValue);
  const preservedVolumes = getRecordArray(baseVolumesValue).filter((volume) => {
    const name = getStringValue(volume.name);
    return name && !replacedVolumeNames.has(name);
  });

  return [...preservedVolumes, ...generatedVolumes];
};

const mergeVolumeClaimTemplates = (
  baseTemplatesValue: unknown,
  generatedTemplatesValue: unknown,
  replacedVolumeNames: Set<string>,
) => {
  const generatedTemplates = getRecordArray(generatedTemplatesValue);
  const preservedTemplates = getRecordArray(baseTemplatesValue).filter(
    (template) => {
      const name = getStringValue(getRecordValue(template.metadata)?.name);
      return name && !replacedVolumeNames.has(name);
    },
  );

  return [...preservedTemplates, ...generatedTemplates];
};

const applySchedulingSettings = (
  podSpec: ManifestRecord,
  generatedPodSpec: ManifestRecord,
) => {
  const currentAffinity = getRecordValue(podSpec.affinity) || {};
  const generatedAffinity = getRecordValue(generatedPodSpec.affinity) || {};
  const nextAffinity = { ...currentAffinity };

  delete nextAffinity.podAffinity;
  delete nextAffinity.podAntiAffinity;

  if (generatedAffinity.podAffinity) {
    nextAffinity.podAffinity = generatedAffinity.podAffinity;
  }
  if (generatedAffinity.podAntiAffinity) {
    nextAffinity.podAntiAffinity = generatedAffinity.podAntiAffinity;
  }

  if (Object.keys(nextAffinity).length > 0) {
    podSpec.affinity = nextAffinity;
  } else {
    delete podSpec.affinity;
  }
};

const buildUpdatedWorkloadSettingsManifest = (
  type: API.ClusterWorkloadType,
  baseManifest: ManifestRecord,
  values: CreateWorkloadFormValues,
): ManifestRecord => {
  const nextManifest = cloneManifest(baseManifest);
  const generatedManifest = buildCreateWorkloadManifest(type, values);
  const spec = ensureRecordField(nextManifest, 'spec');
  const template = ensureRecordField(spec, 'template');
  const podSpec = ensureRecordField(template, 'spec');
  const generatedSpec = getManifestSpec(generatedManifest);
  const generatedPodSpec = getManifestPodSpec(generatedManifest);
  const oldManagedVolumeNames = getSupportedStorageVolumeNames(baseManifest);
  const generatedVolumeNames = new Set([
    ...getVolumeNames(getRecordArray(generatedPodSpec.volumes)),
    ...getRecordArray(generatedSpec.volumeClaimTemplates).flatMap(
      (template) => {
        const name = getStringValue(getRecordValue(template.metadata)?.name);
        return name ? [name] : [];
      },
    ),
  ]);
  const replacedVolumeNames = new Set([
    ...oldManagedVolumeNames,
    ...generatedVolumeNames,
  ]);

  if (type !== 'DaemonSet') {
    spec.replicas = values.replicas ?? 0;
  }

  if (type === 'Deployment') {
    spec.strategy = generatedSpec.strategy;
  } else {
    spec.updateStrategy = generatedSpec.updateStrategy;
    if (type === 'DaemonSet') {
      spec.minReadySeconds = generatedSpec.minReadySeconds;
    }
  }

  const containers = mergeContainerList(
    podSpec.containers,
    generatedPodSpec.containers,
    replacedVolumeNames,
  );
  const initContainers = mergeContainerList(
    podSpec.initContainers,
    generatedPodSpec.initContainers,
    replacedVolumeNames,
  );
  podSpec.containers = containers;
  if (initContainers.length > 0) {
    podSpec.initContainers = initContainers;
  } else {
    delete podSpec.initContainers;
  }

  const volumes = mergeVolumes(
    podSpec.volumes,
    generatedPodSpec.volumes,
    replacedVolumeNames,
  );
  if (volumes.length > 0) {
    podSpec.volumes = volumes;
  } else {
    delete podSpec.volumes;
  }

  if (type === 'StatefulSet') {
    const volumeClaimTemplates = mergeVolumeClaimTemplates(
      spec.volumeClaimTemplates,
      generatedSpec.volumeClaimTemplates,
      replacedVolumeNames,
    );
    if (volumeClaimTemplates.length > 0) {
      spec.volumeClaimTemplates = volumeClaimTemplates;
    } else {
      delete spec.volumeClaimTemplates;
    }
  }

  if ('terminationGracePeriodSeconds' in generatedPodSpec) {
    podSpec.terminationGracePeriodSeconds =
      generatedPodSpec.terminationGracePeriodSeconds;
  } else {
    delete podSpec.terminationGracePeriodSeconds;
  }

  applySchedulingSettings(podSpec, generatedPodSpec);
  deleteIfEmpty(template, 'spec');
  deleteIfEmpty(spec, 'template');

  return nextManifest;
};

export { buildUpdatedWorkloadSettingsManifest, getWorkloadSettingsFormValues };
