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
  template: type,
  replicas: type === 'DaemonSet' ? undefined : 1,
  imagePullPolicy: 'IfNotPresent',
  protocol: 'TCP',
  storageType: 'none',
  volumeName: 'data',
  labels: [],
  annotations: [],
});

const normalizeName = (value?: string) => value?.trim() || '';

const getWorkloadStepFields = (
  step: number,
  type: API.ClusterWorkloadType,
): (keyof CreateWorkloadFormValues)[] => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 1) {
    return type === 'DaemonSet'
      ? ['containerName', 'image']
      : ['containerName', 'image', 'replicas'];
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
