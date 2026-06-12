export const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';

export type ResourceActionKey =
  | 'yaml'
  | 'rerun'
  | 'cronJobSuspend'
  | 'serviceSettings'
  | 'serviceExternalAccess'
  | 'ingressRules'
  | 'ingressAnnotations'
  | 'configMapSettings'
  | 'secretSettings'
  | 'podResize'
  | 'pvcClone'
  | 'pvcExpand'
  | 'storageClassDefault'
  | 'storageClassVolumeOperations'
  | 'delete';

export const resourceTypeLabels: Record<API.ClusterResourceCreateType, string> =
  {
    Job: '任务',
    CronJob: '定时任务',
    Pod: '容器组',
    Service: '服务',
    Ingress: '应用路由',
    Secret: '保密字典',
    ConfigMap: '配置字典',
    ServiceAccount: '服务账户',
    Role: '角色',
    ClusterRole: '集群角色',
    RoleBinding: '角色绑定',
    ClusterRoleBinding: '集群角色绑定',
    CustomResourceDefinition: '定制资源定义',
    PersistentVolumeClaim: '持久卷声明',
    StorageClass: '存储类',
  };

export const resourceListPaths: Record<API.ClusterResourceCreateType, string> =
  {
    Job: '/cluster/workloads/jobs',
    CronJob: '/cluster/workloads/cron-jobs',
    Pod: '/cluster/workloads/pods',
    Service: '/cluster/workloads/services',
    Ingress: '/cluster/workloads/ingresses',
    Secret: '/cluster/config/secrets',
    ConfigMap: '/cluster/config/config-maps',
    ServiceAccount: '/cluster/config/service-accounts',
    Role: '/cluster/access-control/roles',
    ClusterRole: '/cluster/access-control/roles',
    RoleBinding: '/cluster/access-control/bindings',
    ClusterRoleBinding: '/cluster/access-control/bindings',
    CustomResourceDefinition: '/cluster/custom-resource-definitions',
    PersistentVolumeClaim: '/cluster/storage/persistent-volume-claims',
    StorageClass: '/cluster/storage/storage-classes',
  };

export const namespacedResourceTypes = new Set<API.ClusterResourceCreateType>([
  'Job',
  'CronJob',
  'Pod',
  'Service',
  'Ingress',
  'Secret',
  'ConfigMap',
  'ServiceAccount',
  'PersistentVolumeClaim',
]);

export const resourceTypes = Object.keys(
  resourceTypeLabels,
) as API.ClusterResourceCreateType[];

export const isResourceType = (
  type?: string,
): type is API.ClusterResourceCreateType =>
  resourceTypes.includes(type as API.ClusterResourceCreateType);

export const sleep = (duration: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
