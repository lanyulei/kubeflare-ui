import type { CreateResourceConfig } from './CreateResourceYamlDrawer';

const getNamespace = (namespace?: string) => namespace || 'default';

export const createJobConfig: CreateResourceConfig = {
  type: 'Job',
  title: '创建任务',
  namespaced: true,
  getDefaultManifest: (namespace) => ({
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: 'example-job',
      namespace: getNamespace(namespace),
    },
    spec: {
      template: {
        spec: {
          restartPolicy: 'Never',
          containers: [
            {
              name: 'main',
              image: 'busybox:latest',
              command: ['sh', '-c', 'echo hello'],
            },
          ],
        },
      },
    },
  }),
};

export const createCronJobConfig: CreateResourceConfig = {
  type: 'CronJob',
  title: '创建定时任务',
  namespaced: true,
  getDefaultManifest: (namespace) => ({
    apiVersion: 'batch/v1',
    kind: 'CronJob',
    metadata: {
      name: 'example-cron-job',
      namespace: getNamespace(namespace),
    },
    spec: {
      schedule: '*/5 * * * *',
      jobTemplate: {
        spec: {
          template: {
            spec: {
              restartPolicy: 'Never',
              containers: [
                {
                  name: 'main',
                  image: 'busybox:latest',
                  command: ['sh', '-c', 'date'],
                },
              ],
            },
          },
        },
      },
    },
  }),
};

export const createPodConfig: CreateResourceConfig = {
  type: 'Pod',
  title: '创建容器组',
  namespaced: true,
  getDefaultManifest: (namespace) => ({
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'example-pod',
      namespace: getNamespace(namespace),
    },
    spec: {
      containers: [
        {
          name: 'main',
          image: 'nginx:latest',
        },
      ],
    },
  }),
};

export const createServiceConfig: CreateResourceConfig = {
  type: 'Service',
  title: '创建服务',
  namespaced: true,
  getDefaultManifest: (namespace) => ({
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: 'example-service',
      namespace: getNamespace(namespace),
    },
    spec: {
      type: 'ClusterIP',
      selector: {
        app: 'example',
      },
      ports: [
        {
          name: 'http',
          port: 80,
          targetPort: 80,
        },
      ],
    },
  }),
};

export const createIngressConfig: CreateResourceConfig = {
  type: 'Ingress',
  title: '创建应用路由',
  namespaced: true,
  getDefaultManifest: (namespace) => ({
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name: 'example-ingress',
      namespace: getNamespace(namespace),
    },
    spec: {
      rules: [
        {
          host: 'example.local',
          http: {
            paths: [
              {
                path: '/',
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: 'example-service',
                    port: {
                      number: 80,
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  }),
};

export const createSecretConfig: CreateResourceConfig = {
  type: 'Secret',
  title: '创建保密字典',
  namespaced: true,
  getDefaultManifest: (namespace) => ({
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'example-secret',
      namespace: getNamespace(namespace),
    },
    type: 'Opaque',
    stringData: {
      key: 'value',
    },
  }),
};

export const createConfigMapConfig: CreateResourceConfig = {
  type: 'ConfigMap',
  title: '创建配置字典',
  namespaced: true,
  getDefaultManifest: (namespace) => ({
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: 'example-config-map',
      namespace: getNamespace(namespace),
    },
    data: {
      key: 'value',
    },
  }),
};

export const createServiceAccountConfig: CreateResourceConfig = {
  type: 'ServiceAccount',
  title: '创建服务账户',
  namespaced: true,
  getDefaultManifest: (namespace) => ({
    apiVersion: 'v1',
    kind: 'ServiceAccount',
    metadata: {
      name: 'example-service-account',
      namespace: getNamespace(namespace),
    },
  }),
};

export const createCustomResourceDefinitionConfig: CreateResourceConfig = {
  type: 'CustomResourceDefinition',
  title: '创建定制资源定义',
  getDefaultManifest: () => ({
    apiVersion: 'apiextensions.k8s.io/v1',
    kind: 'CustomResourceDefinition',
    metadata: {
      name: 'examples.example.kubeflare.io',
    },
    spec: {
      group: 'example.kubeflare.io',
      scope: 'Namespaced',
      names: {
        plural: 'examples',
        singular: 'example',
        kind: 'Example',
      },
      versions: [
        {
          name: 'v1',
          served: true,
          storage: true,
          schema: {
            openAPIV3Schema: {
              type: 'object',
            },
          },
        },
      ],
    },
  }),
};

export const createPersistentVolumeClaimConfig: CreateResourceConfig = {
  type: 'PersistentVolumeClaim',
  title: '创建持久卷声明',
  namespaced: true,
  getDefaultManifest: (namespace) => ({
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: 'example-pvc',
      namespace: getNamespace(namespace),
    },
    spec: {
      accessModes: ['ReadWriteOnce'],
      resources: {
        requests: {
          storage: '1Gi',
        },
      },
    },
  }),
};

export const createStorageClassConfig: CreateResourceConfig = {
  type: 'StorageClass',
  title: '创建存储类',
  getDefaultManifest: () => ({
    apiVersion: 'storage.k8s.io/v1',
    kind: 'StorageClass',
    metadata: {
      name: 'example-storage-class',
    },
    provisioner: 'kubernetes.io/no-provisioner',
    volumeBindingMode: 'WaitForFirstConsumer',
  }),
};
