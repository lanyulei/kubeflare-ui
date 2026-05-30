import {
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExpandAltOutlined,
  FileTextOutlined,
  GlobalOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  App,
  Button,
  Card,
  Drawer,
  Dropdown,
  Empty,
  Spin,
  Tabs,
  Tooltip,
} from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parse, stringify } from 'yaml';
import {
  ClusterEventTable,
  ClusterMetadata,
  ReplicaSummary,
  SectionTitle,
  YamlEditor,
} from '@/components';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import { getClusterNodePodList } from '@/services/kubeflare/cluster/node';
import {
  createClusterResource,
  deleteClusterResource,
  getClusterResourceManifest,
  getClusterServiceEndpoints,
  getClusterServiceList,
  getClusterStorageClassList,
  rerunClusterJob,
  resizeClusterPodResources,
  updateClusterCronJobSuspend,
  updateClusterJobReplicas,
  updateClusterPersistentVolumeClaimPatch,
  updateClusterResourceManifest,
  updateClusterServicePatch,
} from '@/services/kubeflare/cluster/resource';
import { getClusterWorkloadList } from '@/services/kubeflare/cluster/workload';
import { createKeyValueItem } from '../../workloads/ingresses/components/CreateIngressDrawer/helpers';
import type { IngressServiceOption } from '../../workloads/ingresses/components/CreateIngressDrawer/types';
import { ConfigMapSettingsEditDrawer } from './components/ConfigMapEditDrawers';
import CustomResourceTable from './components/CustomResourceTable';
import {
  buildConfigMapBasicInfo,
  buildConfigMapDataItems,
  type ConfigMapBasicInfo,
} from './components/configMapHelpers';
import {
  buildCustomResourceDefinitionBasicInfo,
  buildCustomResourceDefinitionVersions,
  type CustomResourceDefinitionBasicInfo,
} from './components/customResourceDefinitionHelpers';
import {
  formatValue,
  getArrayValue,
  getNumberValue,
  getRecordValue,
  getStringValue,
} from './components/helpers';
import {
  IngressAnnotationsEditDrawer,
  IngressRouteRulesEditDrawer,
} from './components/IngressEditDrawers';
import IngressResourceStatus from './components/IngressResourceStatus';
import {
  buildIngressBasicInfo,
  buildIngressRules,
  type IngressBasicInfo,
} from './components/ingressHelpers';
import JobEnvironmentVariables from './components/JobEnvironmentVariables';
import JobResourceStatus from './components/JobResourceStatus';
import JobRunRecords from './components/JobRunRecords';
import {
  getPersistentVolumeClaimSizeGi,
  PersistentVolumeClaimCloneDrawer,
  PersistentVolumeClaimExpandDrawer,
} from './components/PersistentVolumeClaimEditDrawers';
import PersistentVolumeClaimResourceStatus from './components/PersistentVolumeClaimResourceStatus';
import PersistentVolumeClaimTable from './components/PersistentVolumeClaimTable';
import PodResizeDrawer from './components/PodResizeDrawer';
import PodResourceStatus from './components/PodResourceStatus';
import PodSchedulingInfo from './components/PodSchedulingInfo';
import {
  buildPersistentVolumeClaimBasicInfo,
  formatPersistentVolumeClaimValue,
  getPersistentVolumeClaimStorageClassName,
  hasPersistentVolumeClaim,
  type PersistentVolumeClaimBasicInfo,
} from './components/persistentVolumeClaimHelpers';
import {
  buildPodBasicInfo,
  buildPodConditions,
  buildPodDetail,
  type PodBasicInfo,
} from './components/podHelpers';
import {
  buildContainerResourcesFromForm,
  buildPodResizePatch,
  getPodResizeMessage,
  getPodResizeStatus,
  type PodResizeFormValues,
} from './components/podResizeHelpers';
import ResourceBasicInfo from './components/ResourceBasicInfo';
import ResourceDataFields from './components/ResourceDataFields';
import { SecretSettingsEditDrawer } from './components/SecretEditDrawers';
import SecretResourceData from './components/SecretResourceData';
import {
  ServiceExternalAccessEditDrawer,
  ServiceSettingsEditDrawer,
} from './components/ServiceEditDrawers';
import ServiceResourceStatus from './components/ServiceResourceStatus';
import StatusText from './components/StatusText';
import {
  type StorageClassVolumeOperationFormValues,
  StorageClassVolumeOperationModal,
} from './components/StorageClassEditModals';
import {
  buildSecretBasicInfo,
  buildSecretDataView,
  type SecretBasicInfo,
} from './components/secretHelpers';
import {
  buildServiceBasicInfo,
  buildServicePorts,
  getServiceLabelSelector,
  getServiceSelector,
  matchServiceWorkload,
  type ServiceBasicInfo,
} from './components/serviceHelpers';
import {
  applyStorageClassDefault,
  applyStorageClassVolumeOperations,
  buildStorageClassBasicInfo,
  buildStorageClassVolumeOperations,
  formatStorageClassBoolean,
  getReclaimPolicyLabel,
  isDefaultStorageClass,
  type StorageClassBasicInfo,
} from './components/storageClassHelpers';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';

type IngressServicePortOption = NonNullable<
  IngressServiceOption['ports']
>[number];

const buildIngressServicePortOptions = (
  ports?: API.ClusterServiceItem['ports'],
): IngressServicePortOption[] =>
  (ports || []).flatMap((port) => {
    const options: IngressServicePortOption[] = [];

    if (port.name) {
      options.push({
        label: port.port ? `${port.name} (${port.port})` : port.name,
        value: port.name,
      });
    }
    if (port.port) {
      options.push({
        label: String(port.port),
        value: port.port,
      });
    }

    return options;
  });

const resourceTypeLabels: Record<API.ClusterResourceCreateType, string> = {
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

const resourceListPaths: Record<API.ClusterResourceCreateType, string> = {
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

const namespacedResourceTypes = new Set<API.ClusterResourceCreateType>([
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

const resourceTypes = Object.keys(
  resourceTypeLabels,
) as API.ClusterResourceCreateType[];

const sleep = (duration: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

type ResourceActionKey =
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

const useStyles = createStyles(({ token }) => ({
  content: {
    backgroundColor: token.colorBgContainer,
    border: `1px solid ${token.colorBorder}80`,
    borderRadius: token.borderRadiusLG,
    padding: 18,
  },
  basicInfoContent: {
    display: 'flex',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    gap: 20,
  },
  description: {
    flex: 1,
    minWidth: 420,
  },
  moreInfo: {
    marginTop: 15,
  },
  moreInfoCard: {
    borderColor: `${token.colorBorder}80`,

    '.ant-card-body': {
      paddingTop: 2,
    },
  },
  tabBody: {
    '& > .ant-card-body > .ant-tabs .ant-tabs-content-holder .ant-tabs-tabpane':
      {
        paddingInline: '0 !important',
        paddingBlock: '0 !important',
      },
    '& > .ant-card-body > .ant-tabs .ant-tabs-content-holder .ant-tabs-tabpane-active':
      {
        paddingInline: '0 !important',
        paddingBlock: '0 !important',
      },
    '& > .ant-card-body > .ant-tabs .ant-tabs-content > .ant-tabs-tabpane': {
      paddingInline: '0 !important',
      paddingBlock: '0 !important',
    },
    '& > .ant-card-body > .ant-tabs .ant-tabs-content-holder .ant-tabs-tabpane .ant-pro-card .ant-pro-card-body':
      {
        paddingInline: '0 !important',
        paddingBlock: '0 !important',
      },
    '.ant-tabs-content-holder .ant-pro-table-list-toolbar-container': {
      paddingTop: '0 !important',
    },
  },
  yamlDrawerBody: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  yamlDrawerEditor: {
    flex: 1,
    minHeight: 0,
  },
  yamlDrawerFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
  qosTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
  },
  qosHelpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: 13,
    marginTop: 2,
  },
  qosTooltip: {
    display: 'grid',
    gap: token.marginXXS,
    maxWidth: 360,
    lineHeight: token.lineHeight,
  },
}));

const QosClassTitle = () => {
  const { styles } = useStyles();

  return (
    <span className={styles.qosTitle}>
      QoS 类别
      <Tooltip
        placement="top"
        title={
          <div className={styles.qosTooltip}>
            <div>
              <strong>Guaranteed：</strong>
              CPU/内存 request 与 limit
              都设置且相等，资源保障最高，节点资源紧张时最后被驱逐。
            </div>
            <div>
              <strong>Burstable：</strong>
              至少设置了一个 request 或 limit，但不满足 Guaranteed
              条件，可在空闲资源上突发使用。
            </div>
            <div>
              <strong>BestEffort：</strong>
              未设置 CPU/内存 request 和
              limit，无资源保障，节点资源紧张时最先被驱逐。
            </div>
          </div>
        }
      >
        <QuestionCircleOutlined
          aria-label="QoS 类别说明"
          className={styles.qosHelpIcon}
          tabIndex={0}
        />
      </Tooltip>
    </span>
  );
};

const isResourceType = (type?: string): type is API.ClusterResourceCreateType =>
  resourceTypes.includes(type as API.ClusterResourceCreateType);

const getJobStatus = (manifest?: Record<string, unknown>) => {
  if (!manifest) {
    return undefined;
  }

  const metadata = getRecordValue(manifest.metadata);
  const status = getRecordValue(manifest.status);
  const conditions = getArrayValue(status?.conditions)
    .map((item) => getRecordValue(item))
    .filter(Boolean);

  if (metadata?.deletionTimestamp) {
    return 'terminating';
  }

  const completedCondition = conditions.find(
    (condition) =>
      getStringValue(condition?.type) === 'Complete' &&
      getStringValue(condition?.status) === 'True',
  );
  if (completedCondition || getNumberValue(status?.succeeded)) {
    return 'completed';
  }

  const failedCondition = conditions.find(
    (condition) =>
      getStringValue(condition?.type) === 'Failed' &&
      getStringValue(condition?.status) === 'True',
  );
  if (failedCondition || getNumberValue(status?.failed)) {
    return 'failed';
  }

  if (getNumberValue(status?.active)) {
    return 'running';
  }

  return undefined;
};

const getCronJobStatus = (manifest?: Record<string, unknown>) => {
  if (!manifest) {
    return undefined;
  }

  const metadata = getRecordValue(manifest.metadata);
  const spec = getRecordValue(manifest.spec);
  const status = getRecordValue(manifest.status);

  if (metadata?.deletionTimestamp) {
    return 'terminating';
  }
  if (spec?.suspend === true) {
    return 'suspended';
  }
  if (getArrayValue(status?.active).length > 0) {
    return 'running';
  }
  return 'active';
};

const getConcurrencyPolicyLabel = (policy?: unknown) => {
  if (policy === 'Allow') {
    return '允许并发运行';
  }
  if (policy === 'Forbid') {
    return '跳过新任务';
  }
  if (policy === 'Replace') {
    return '替换旧任务';
  }
  return formatValue(policy);
};

const buildJobBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
) => {
  const metadata = getRecordValue(manifest?.metadata);
  const spec = getRecordValue(manifest?.spec);

  return {
    namespace: metadata?.namespace || fallbackNamespace || '-',
    status: getJobStatus(manifest),
    backoff_limit: spec?.backoffLimit,
    completions: spec?.completions,
    parallelism: spec?.parallelism,
    active_deadline_seconds: spec?.activeDeadlineSeconds,
  };
};

const buildCronJobBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
) => {
  const metadata = getRecordValue(manifest?.metadata);
  const spec = getRecordValue(manifest?.spec);

  return {
    namespace: metadata?.namespace || fallbackNamespace || '-',
    status: getCronJobStatus(manifest),
    schedule: spec?.schedule,
    starting_deadline_seconds: spec?.startingDeadlineSeconds,
    successful_jobs_history_limit: spec?.successfulJobsHistoryLimit,
    failed_jobs_history_limit: spec?.failedJobsHistoryLimit,
    concurrency_policy: spec?.concurrencyPolicy,
    create_time: metadata?.creationTimestamp,
  };
};

const buildServiceAccountBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
) => {
  const metadata = getRecordValue(manifest?.metadata);

  return {
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace || '-',
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const buildJobReplicaSummary = (manifest?: Record<string, unknown>) => {
  const spec = getRecordValue(manifest?.spec);
  const status = getRecordValue(manifest?.status);
  const conditions = getArrayValue(status?.conditions)
    .map((item) => getRecordValue(item))
    .filter(Boolean);
  const completions = getNumberValue(spec?.completions);
  const parallelism = getNumberValue(spec?.parallelism);
  const activePods = getNumberValue(status?.active) ?? 0;
  const succeededPods = getNumberValue(status?.succeeded) ?? 0;
  const isSuspended = spec?.suspend === true;
  const isTerminal = conditions.some((condition) => {
    const type = getStringValue(condition?.type);
    const conditionStatus = getStringValue(condition?.status);

    return (
      conditionStatus === 'True' && (type === 'Complete' || type === 'Failed')
    );
  });
  const desiredActivePods =
    isSuspended || isTerminal
      ? 0
      : completions === undefined
        ? succeededPods > 0
          ? activePods
          : (parallelism ?? 1)
        : Math.max(0, Math.min(completions - succeededPods, parallelism ?? 1));

  return {
    desiredReplicas: desiredActivePods,
    currentReplicas: activePods,
    scalable: Boolean(manifest && !isSuspended && !isTerminal),
  };
};

const getJobPodSelectors = (name?: string) =>
  name ? [`batch.kubernetes.io/job-name=${name}`, `job-name=${name}`] : [];

type JobBasicInfo = ReturnType<typeof buildJobBasicInfo>;
type CronJobBasicInfo = ReturnType<typeof buildCronJobBasicInfo>;
type ServiceAccountBasicInfo = ReturnType<typeof buildServiceAccountBasicInfo>;

const customResourceDefinitionBasicInfoColumns: ProDescriptionsItemProps<CustomResourceDefinitionBasicInfo>[] =
  [
    {
      title: '作用域',
      dataIndex: 'scope',
      renderText: (value) => formatValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

const storageClassBasicInfoColumns: ProDescriptionsItemProps<StorageClassBasicInfo>[] =
  [
    {
      title: '默认存储卷',
      dataIndex: 'default_volume',
      renderText: (value) => formatStorageClassBoolean(value),
    },
    {
      title: '供应者',
      dataIndex: 'provisioner',
      renderText: (value) => formatValue(value),
    },
    {
      title: '允许卷克隆',
      dataIndex: 'allow_volume_clone',
      renderText: (value) => formatStorageClassBoolean(value),
    },
    {
      title: '允许卷拓展',
      dataIndex: 'allow_volume_expansion',
      renderText: (value) => formatStorageClassBoolean(value),
    },
    {
      title: '回收机制',
      dataIndex: 'reclaim_policy',
      renderText: (value) => getReclaimPolicyLabel(value),
    },
    {
      title: '允许卷快照',
      dataIndex: 'allow_volume_snapshot',
      renderText: (value) => formatStorageClassBoolean(value),
    },
  ];

const persistentVolumeClaimBasicInfoColumns: ProDescriptionsItemProps<PersistentVolumeClaimBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => <StatusText status={record.status} />,
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: '访问模式',
      dataIndex: 'access_modes',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: '供应者',
      dataIndex: 'provisioner',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: '存储类',
      dataIndex: 'storage_class',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: '持久卷',
      dataIndex: 'volume_name',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

const secretBasicInfoColumns: ProDescriptionsItemProps<SecretBasicInfo>[] = [
  {
    title: '命名空间',
    dataIndex: 'namespace',
  },
  {
    title: '类型',
    dataIndex: 'type',
    renderText: (value) => formatValue(value),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    valueType: 'dateTime',
  },
];

const configMapBasicInfoColumns: ProDescriptionsItemProps<ConfigMapBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

const ingressBasicInfoColumns: ProDescriptionsItemProps<IngressBasicInfo>[] = [
  {
    title: '命名空间',
    dataIndex: 'namespace',
  },
  {
    title: '网关地址',
    dataIndex: 'gateway_address',
    renderText: (value) => formatValue(value),
  },
  {
    title: 'Ingress Class',
    dataIndex: 'ingress_class',
    renderText: (value) => formatValue(value),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    valueType: 'dateTime',
  },
];

const serviceBasicInfoColumns: ProDescriptionsItemProps<ServiceBasicInfo>[] = [
  {
    title: '命名空间',
    dataIndex: 'namespace',
  },
  {
    title: '类型',
    dataIndex: 'type',
    renderText: (value) => formatValue(value),
  },
  {
    title: '虚拟 IP 地址',
    dataIndex: 'cluster_ip',
    renderText: (value) => formatValue(value),
  },
  {
    title: '外部 IP 地址',
    dataIndex: 'external_ip',
    renderText: (value) => formatValue(value),
  },
  {
    title: 'IP Family 策略',
    dataIndex: 'ip_family_policy',
    renderText: (value) => formatValue(value),
  },
  {
    title: 'IP Families',
    dataIndex: 'ip_families',
    renderText: (value) => formatValue(value),
  },
  {
    title: '内部流量策略',
    dataIndex: 'internal_traffic_policy',
    renderText: (value) => formatValue(value),
  },
  {
    title: '外部流量策略',
    dataIndex: 'external_traffic_policy',
    renderText: (value) => formatValue(value),
  },
  {
    title: '流量分布',
    dataIndex: 'traffic_distribution',
    renderText: (value) => formatValue(value),
  },
  {
    title: 'LoadBalancer Class',
    dataIndex: 'load_balancer_class',
    renderText: (value) => formatValue(value),
  },
  {
    title: '会话亲和性',
    dataIndex: 'session_affinity',
    renderText: (value) => formatValue(value),
  },
  {
    title: '选择器',
    dataIndex: 'selector',
    renderText: (value) => formatValue(value),
  },
  {
    title: 'DNS',
    dataIndex: 'dns',
    renderText: (value) => formatValue(value),
  },
  {
    title: '端点',
    dataIndex: 'endpoints',
    renderText: (value) => formatValue(value),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    valueType: 'dateTime',
  },
];

const serviceAccountBasicInfoColumns: ProDescriptionsItemProps<ServiceAccountBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

const jobBasicInfoColumns: ProDescriptionsItemProps<JobBasicInfo>[] = [
  {
    title: '命名空间',
    dataIndex: 'namespace',
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (_, record) => <StatusText status={record.status} />,
  },
  {
    title: '最大重试次数',
    dataIndex: 'backoff_limit',
    renderText: (value) => formatValue(value),
  },
  {
    title: '容器组完成数量',
    dataIndex: 'completions',
    renderText: (value) => formatValue(value),
  },
  {
    title: '并行容器组数量',
    dataIndex: 'parallelism',
    renderText: (value) => formatValue(value),
  },
  {
    title: '最大运行时间（s）',
    dataIndex: 'active_deadline_seconds',
    renderText: (value) => formatValue(value),
  },
];

const cronJobBasicInfoColumns: ProDescriptionsItemProps<CronJobBasicInfo>[] = [
  {
    title: '命名空间',
    dataIndex: 'namespace',
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (_, record) => <StatusText status={record.status} />,
  },
  {
    title: '定时计划',
    dataIndex: 'schedule',
    renderText: (value) => formatValue(value),
  },
  {
    title: '最大启动延后时间（s）',
    dataIndex: 'starting_deadline_seconds',
    renderText: (value) => formatValue(value),
  },
  {
    title: '成功任务保留数量',
    dataIndex: 'successful_jobs_history_limit',
    renderText: (value) => formatValue(value),
  },
  {
    title: '失败任务保留数量',
    dataIndex: 'failed_jobs_history_limit',
    renderText: (value) => formatValue(value),
  },
  {
    title: '并发策略',
    dataIndex: 'concurrency_policy',
    renderText: (value) => getConcurrencyPolicyLabel(value),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    valueType: 'dateTime',
  },
];

const podBasicInfoColumns: ProDescriptionsItemProps<PodBasicInfo>[] = [
  {
    title: '命名空间',
    dataIndex: 'namespace',
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (_, record) => <StatusText status={record.status} />,
  },
  {
    title: '容器组 IP 地址',
    dataIndex: 'pod_ip',
    renderText: (value) => formatValue(value),
  },
  {
    title: '节点名称',
    dataIndex: 'node_name',
    renderText: (value) => formatValue(value),
  },
  {
    title: '节点 IP 地址',
    dataIndex: 'node_ip',
    renderText: (value) => formatValue(value),
  },
  {
    title: '重启次数',
    dataIndex: 'restart_count',
    renderText: (value) => formatValue(value),
  },
  {
    title: <QosClassTitle />,
    dataIndex: 'qos_class',
    renderText: (value) => formatValue(value),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    valueType: 'dateTime',
  },
];

const ClusterResourceDetail = () => {
  const { message, modal } = App.useApp();
  const { styles } = useStyles();
  const params = useParams<{
    type?: string;
    namespace?: string;
    name?: string;
  }>();
  const type = isResourceType(params.type) ? params.type : undefined;
  const namespace = params.namespace === '-' ? undefined : params.namespace;
  const name = params.name;
  const detailParams =
    type && name
      ? {
          type,
          namespace,
          name,
        }
      : undefined;
  const [loading, setLoading] = useState(false);
  const [podLoading, setPodLoading] = useState(false);
  const [workloadLoading, setWorkloadLoading] = useState(false);
  const [scaling, setScaling] = useState(false);
  const [actionLoading, setActionLoading] = useState<ResourceActionKey>();
  const [yamlDrawerOpen, setYamlDrawerOpen] = useState(false);
  const [serviceSettingsDrawerOpen, setServiceSettingsDrawerOpen] =
    useState(false);
  const [serviceExternalAccessDrawerOpen, setServiceExternalAccessDrawerOpen] =
    useState(false);
  const [ingressRouteRulesDrawerOpen, setIngressRouteRulesDrawerOpen] =
    useState(false);
  const [ingressAnnotationModalOpen, setIngressAnnotationModalOpen] =
    useState(false);
  const [configMapSettingsDrawerOpen, setConfigMapSettingsDrawerOpen] =
    useState(false);
  const [secretSettingsDrawerOpen, setSecretSettingsDrawerOpen] =
    useState(false);
  const [podResizeDrawerOpen, setPodResizeDrawerOpen] = useState(false);
  const [pvcCloneDrawerOpen, setPvcCloneDrawerOpen] = useState(false);
  const [pvcExpandDrawerOpen, setPvcExpandDrawerOpen] = useState(false);
  const [
    storageClassVolumeOperationModalOpen,
    setStorageClassVolumeOperationModalOpen,
  ] = useState(false);
  const [ingressAnnotationRows, setIngressAnnotationRows] = useState<
    KeyValueEditorItem[]
  >([]);
  const [ingressServiceOptions, setIngressServiceOptions] = useState<
    IngressServiceOption[]
  >([]);
  const [yamlValue, setYamlValue] = useState('');
  const [manifest, setManifest] = useState<Record<string, unknown>>();
  const [resizeContainer, setResizeContainer] =
    useState<API.ClusterNodePodContainer>();
  const podResizePollingRef = useRef(0);
  const [detailType, setDetailType] = useState<
    API.ClusterResourceCreateType | undefined
  >(type);
  const [pods, setPods] = useState<API.ClusterNodePodItem[]>([]);
  const [serviceEndpoints, setServiceEndpoints] = useState<
    API.ClusterServiceEndpointItem[]
  >([]);
  const [serviceWorkloads, setServiceWorkloads] = useState<
    API.ClusterWorkloadItem[]
  >([]);
  const [pvcStorageClassProvisioner, setPvcStorageClassProvisioner] =
    useState<string>();
  const metadata = useMemo(
    () => getRecordValue(manifest?.metadata),
    [manifest],
  );
  const annotations = useMemo(
    () => getRecordValue(metadata?.annotations) as Record<string, string>,
    [metadata],
  );
  const basicInfo = useMemo(
    () =>
      detailType === 'Pod'
        ? buildPodBasicInfo(manifest, namespace)
        : detailType === 'Service'
          ? buildServiceBasicInfo(manifest, serviceEndpoints, namespace)
          : detailType === 'ServiceAccount'
            ? buildServiceAccountBasicInfo(manifest, namespace)
            : detailType === 'Secret'
              ? buildSecretBasicInfo(manifest, namespace)
              : detailType === 'ConfigMap'
                ? buildConfigMapBasicInfo(manifest, namespace)
                : detailType === 'Ingress'
                  ? buildIngressBasicInfo(manifest, namespace)
                  : detailType === 'CronJob'
                    ? buildCronJobBasicInfo(manifest, namespace)
                    : detailType === 'CustomResourceDefinition'
                      ? buildCustomResourceDefinitionBasicInfo(manifest)
                      : detailType === 'PersistentVolumeClaim'
                        ? buildPersistentVolumeClaimBasicInfo(
                            manifest,
                            namespace,
                            pvcStorageClassProvisioner,
                          )
                        : detailType === 'StorageClass'
                          ? buildStorageClassBasicInfo(manifest)
                          : buildJobBasicInfo(manifest, namespace),
    [
      detailType,
      manifest,
      namespace,
      pvcStorageClassProvisioner,
      serviceEndpoints,
    ],
  );
  const podDetail = useMemo(() => buildPodDetail(manifest), [manifest]);
  const podConditions = useMemo(() => buildPodConditions(manifest), [manifest]);
  const replicaSummary = useMemo(
    () => buildJobReplicaSummary(manifest),
    [manifest],
  );
  const servicePorts = useMemo(() => buildServicePorts(manifest), [manifest]);
  const ingressRules = useMemo(() => buildIngressRules(manifest), [manifest]);
  const configMapDataItems = useMemo(
    () => buildConfigMapDataItems(manifest),
    [manifest],
  );
  const secretData = useMemo(() => buildSecretDataView(manifest), [manifest]);
  const customResourceDefinitionVersions = useMemo(
    () => buildCustomResourceDefinitionVersions(manifest),
    [manifest],
  );
  const persistentVolumeClaimSizeGi = useMemo(
    () => getPersistentVolumeClaimSizeGi(manifest),
    [manifest],
  );
  const storageClassVolumeOperations = useMemo(
    () => buildStorageClassVolumeOperations(manifest),
    [manifest],
  );
  const storageClassDefault = isDefaultStorageClass(manifest);
  const cronJobSuspended = getRecordValue(manifest?.spec)?.suspend === true;
  const resourceActionItems = [
    ...(type === 'Job'
      ? [
          {
            key: 'rerun',
            icon: <ReloadOutlined />,
            label: '重新运行',
          },
        ]
      : []),
    ...(type === 'CronJob'
      ? [
          {
            key: 'cronJobSuspend',
            icon: cronJobSuspended ? (
              <PlayCircleOutlined />
            ) : (
              <PauseCircleOutlined />
            ),
            label: cronJobSuspended ? '恢复' : '暂停',
          },
        ]
      : []),
    ...(type === 'Service'
      ? [
          {
            key: 'serviceSettings',
            icon: <EditOutlined />,
            label: '编辑服务',
          },
          {
            key: 'serviceExternalAccess',
            icon: <GlobalOutlined />,
            label: '编辑外部访问',
          },
        ]
      : []),
    ...(type === 'Ingress'
      ? [
          {
            key: 'ingressRules',
            icon: <GlobalOutlined />,
            label: '编辑路由规则',
          },
          {
            key: 'ingressAnnotations',
            icon: <EditOutlined />,
            label: '编辑注解',
          },
        ]
      : []),
    ...(type === 'Secret'
      ? [
          {
            key: 'secretSettings',
            icon: <SettingOutlined />,
            label: '编辑设置',
          },
        ]
      : []),
    ...(type === 'ConfigMap'
      ? [
          {
            key: 'configMapSettings',
            icon: <SettingOutlined />,
            label: '编辑设置',
          },
        ]
      : []),
    ...(type === 'PersistentVolumeClaim'
      ? [
          {
            key: 'pvcClone',
            icon: <CopyOutlined />,
            label: '克隆',
          },
          {
            key: 'pvcExpand',
            icon: <ExpandAltOutlined />,
            label: '拓展',
          },
        ]
      : []),
    ...(type === 'StorageClass'
      ? [
          {
            disabled: storageClassDefault,
            key: 'storageClassDefault',
            icon: <SettingOutlined />,
            label: storageClassDefault ? '已是默认存储类' : '设置默认存储类',
          },
          {
            key: 'storageClassVolumeOperations',
            icon: <SettingOutlined />,
            label: '设置卷操作',
          },
        ]
      : []),
    {
      key: 'yaml',
      icon: <FileTextOutlined />,
      label: '编辑 YAML',
    },
    {
      danger: true,
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
    },
  ];

  const fetchManifest = useCallback(async () => {
    if (!type || !name) {
      setManifest(undefined);
      setDetailType(undefined);
      return;
    }

    setLoading(true);
    try {
      try {
        const res = await getClusterResourceManifest({
          type,
          namespace,
          name,
        });
        setManifest(res.data);
        setDetailType(type);
      } catch (error) {
        if (type !== 'CronJob' || !namespace) {
          throw error;
        }

        const res = await getClusterResourceManifest({
          type: 'Pod',
          namespace,
          name,
        });
        setManifest(res.data);
        setDetailType('Pod');
      }
    } finally {
      setLoading(false);
    }
  }, [name, namespace, type]);

  const fetchPods = useCallback(async () => {
    if (
      !namespace ||
      !name ||
      (type !== 'Job' && type !== 'Service' && type !== 'PersistentVolumeClaim')
    ) {
      setPods([]);
      return;
    }

    setPodLoading(true);
    try {
      if (type === 'Service') {
        const labelSelector = getServiceLabelSelector(manifest);

        if (!labelSelector) {
          setPods([]);
          return;
        }

        const res = await getClusterNodePodList({
          namespace,
          labelSelector,
          limit: 500,
        });
        setPods(res.data.items || []);
        return;
      }

      if (type === 'PersistentVolumeClaim') {
        const res = await getClusterNodePodList({
          namespace,
          limit: 500,
        });
        setPods(
          (res.data.items || []).filter((pod) =>
            hasPersistentVolumeClaim(pod, name),
          ),
        );
        return;
      }

      const selectors = getJobPodSelectors(name);

      for (const labelSelector of selectors) {
        const res = await getClusterNodePodList({
          namespace,
          labelSelector,
          limit: 500,
        });
        const items = res.data.items || [];

        if (
          items.length > 0 ||
          labelSelector === selectors[selectors.length - 1]
        ) {
          setPods(items);
          break;
        }
      }
    } finally {
      setPodLoading(false);
    }
  }, [manifest, name, namespace, type]);

  const fetchServiceEndpoints = useCallback(async () => {
    if (type !== 'Service' || !namespace || !name) {
      setServiceEndpoints([]);
      return;
    }

    try {
      const res = await getClusterServiceEndpoints({ namespace, name });
      setServiceEndpoints(res.data.items || []);
    } catch {
      setServiceEndpoints([]);
    }
  }, [name, namespace, type]);

  const fetchServiceWorkloads = useCallback(async () => {
    if (type !== 'Service' || !namespace || !manifest) {
      setServiceWorkloads([]);
      return;
    }

    const serviceSelector = getServiceSelector(manifest);

    if (!serviceSelector || Object.keys(serviceSelector).length === 0) {
      setServiceWorkloads([]);
      return;
    }

    setWorkloadLoading(true);
    try {
      const res = await getClusterWorkloadList({ namespace });
      setServiceWorkloads(
        (res.data.items || []).filter((workload) =>
          matchServiceWorkload(workload, serviceSelector),
        ),
      );
    } finally {
      setWorkloadLoading(false);
    }
  }, [manifest, namespace, type]);

  const fetchIngressServiceOptions = useCallback(async () => {
    if (type !== 'Ingress' || !namespace) {
      setIngressServiceOptions([]);
      return;
    }

    const res = await getClusterServiceList({ namespace });
    setIngressServiceOptions(
      (res.data.items || []).flatMap((item) =>
        item.name && item.name !== '-'
          ? [
              {
                label: item.name,
                ports: buildIngressServicePortOptions(item.ports),
                value: item.name,
              },
            ]
          : [],
      ),
    );
  }, [namespace, type]);

  const fetchPvcStorageClassProvisioner = useCallback(async () => {
    if (type !== 'PersistentVolumeClaim' || !manifest) {
      setPvcStorageClassProvisioner(undefined);
      return;
    }

    const storageClassName = getPersistentVolumeClaimStorageClassName(manifest);

    if (!storageClassName) {
      setPvcStorageClassProvisioner(undefined);
      return;
    }

    try {
      const res = await getClusterResourceManifest({
        type: 'StorageClass',
        name: storageClassName,
      });
      setPvcStorageClassProvisioner(
        getStringValue(getRecordValue(res.data)?.provisioner),
      );
    } catch {
      setPvcStorageClassProvisioner(undefined);
    }
  }, [manifest, type]);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  useEffect(() => {
    fetchPods();
  }, [fetchPods]);

  useEffect(
    () => () => {
      podResizePollingRef.current += 1;
    },
    [],
  );

  useEffect(() => {
    fetchServiceEndpoints();
  }, [fetchServiceEndpoints]);

  useEffect(() => {
    fetchServiceWorkloads();
  }, [fetchServiceWorkloads]);

  useEffect(() => {
    fetchPvcStorageClassProvisioner();
  }, [fetchPvcStorageClassProvisioner]);

  useEffect(() => {
    if (ingressRouteRulesDrawerOpen) {
      void fetchIngressServiceOptions();
    }
  }, [fetchIngressServiceOptions, ingressRouteRulesDrawerOpen]);

  useEffect(() => {
    const refresh = () => {
      void fetchManifest();
      void fetchPods();
      void fetchServiceEndpoints();
      void fetchServiceWorkloads();
      void fetchPvcStorageClassProvisioner();
    };

    window.addEventListener(CURRENT_CLUSTER_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener(CURRENT_CLUSTER_CHANGE_EVENT, refresh);
    };
  }, [
    fetchManifest,
    fetchPods,
    fetchPvcStorageClassProvisioner,
    fetchServiceEndpoints,
    fetchServiceWorkloads,
  ]);

  const handleScaleJobReplicas = async (replicas: number) => {
    if (type !== 'Job' || !namespace || !name) {
      return;
    }

    setScaling(true);
    try {
      const res = await updateClusterJobReplicas({
        namespace,
        name,
        replicas,
      });
      message.success('副本数已更新');
      setManifest(res.data);
      await fetchManifest();
      await fetchPods();
    } finally {
      setScaling(false);
    }
  };

  const handleRerunJob = () => {
    if (type !== 'Job' || !namespace || !name) {
      return;
    }

    modal.confirm({
      title: '确认重新运行该任务吗？',
      content: '重新运行会触发该任务重新执行，并生成新的运行记录。',
      okText: '重新运行',
      cancelText: '取消',
      onOk: async () => {
        if (!manifest) {
          message.error('任务数据不存在，请刷新后重试');
          return;
        }

        setActionLoading('rerun');
        try {
          await rerunClusterJob({
            namespace,
            name,
            manifest,
          });
          message.success('任务已开始重新运行');
          await fetchManifest();
          await fetchPods();
        } catch (error) {
          message.error((error as Error)?.message || '任务重新运行失败');
        } finally {
          setActionLoading(undefined);
        }
      },
    });
  };

  const handleToggleCronJobSuspend = () => {
    if (type !== 'CronJob' || !namespace || !name) {
      return;
    }

    const nextSuspended = !cronJobSuspended;
    const actionText = nextSuspended ? '暂停' : '恢复';

    modal.confirm({
      title: `确认${actionText}该定时任务吗？`,
      content: nextSuspended
        ? '暂停后将不再按计划创建新的任务，已有运行中的任务不受影响。'
        : '恢复后定时任务将继续按计划创建新的任务。',
      okText: actionText,
      cancelText: '取消',
      onOk: async () => {
        setActionLoading('cronJobSuspend');
        try {
          const res = await updateClusterCronJobSuspend({
            namespace,
            name,
            suspend: nextSuspended,
          });
          message.success(`定时任务已${actionText}`);
          setManifest(res.data);
          await fetchManifest();
        } finally {
          setActionLoading(undefined);
        }
      },
    });
  };

  const handleUpdateServicePatch = async (
    patch: Record<string, unknown>,
    actionKey: 'serviceSettings' | 'serviceExternalAccess',
    successText: string,
  ) => {
    if (type !== 'Service' || !namespace || !name) {
      return;
    }

    setActionLoading(actionKey);
    try {
      const res = await updateClusterServicePatch({
        namespace,
        name,
        patch,
      });
      message.success(successText);
      setManifest(res.data);
      setServiceSettingsDrawerOpen(false);
      setServiceExternalAccessDrawerOpen(false);
      await fetchManifest();
      await fetchPods();
      await fetchServiceEndpoints();
      await fetchServiceWorkloads();
    } finally {
      setActionLoading(undefined);
    }
  };

  const handleUpdateIngressManifest = async (
    nextManifest: Record<string, unknown>,
    actionKey: 'ingressRules' | 'ingressAnnotations',
    successText: string,
  ) => {
    if (type !== 'Ingress' || !namespace || !name) {
      return;
    }

    setActionLoading(actionKey);
    try {
      const res = await updateClusterResourceManifest({
        type: 'Ingress',
        namespace,
        name,
        manifest: nextManifest,
      });
      message.success(successText);
      setManifest(res.data);
      setIngressRouteRulesDrawerOpen(false);
      setIngressAnnotationModalOpen(false);
      await fetchManifest();
    } finally {
      setActionLoading(undefined);
    }
  };

  const handleUpdateSecretManifest = async (
    nextManifest: Record<string, unknown>,
  ) => {
    if (type !== 'Secret' || !namespace || !name) {
      return;
    }

    setActionLoading('secretSettings');
    try {
      const res = await updateClusterResourceManifest({
        type: 'Secret',
        namespace,
        name,
        manifest: nextManifest,
      });
      message.success('设置已更新');
      setManifest(res.data);
      setSecretSettingsDrawerOpen(false);
      await fetchManifest();
    } finally {
      setActionLoading(undefined);
    }
  };

  const handleUpdateConfigMapManifest = async (
    nextManifest: Record<string, unknown>,
  ) => {
    if (type !== 'ConfigMap' || !namespace || !name) {
      return;
    }

    setActionLoading('configMapSettings');
    try {
      const res = await updateClusterResourceManifest({
        type: 'ConfigMap',
        namespace,
        name,
        manifest: nextManifest,
      });
      message.success('设置已更新');
      setManifest(res.data);
      setConfigMapSettingsDrawerOpen(false);
      await fetchManifest();
    } finally {
      setActionLoading(undefined);
    }
  };

  const handleClonePersistentVolumeClaim = async (
    nextManifest: Record<string, unknown>,
  ) => {
    if (type !== 'PersistentVolumeClaim' || !namespace) {
      return;
    }

    setActionLoading('pvcClone');
    try {
      await createClusterResource({
        type: 'PersistentVolumeClaim',
        namespace,
        manifest: nextManifest,
      });
      message.success('持久卷声明已克隆');
      setPvcCloneDrawerOpen(false);
      await fetchPods();
    } finally {
      setActionLoading(undefined);
    }
  };

  const handleExpandPersistentVolumeClaim = async (storage: string) => {
    if (type !== 'PersistentVolumeClaim' || !namespace || !name) {
      return;
    }

    setActionLoading('pvcExpand');
    try {
      const res = await updateClusterPersistentVolumeClaimPatch({
        namespace,
        name,
        patch: {
          spec: {
            resources: {
              requests: {
                storage,
              },
            },
          },
        },
      });
      message.success('持久卷声明容量已更新');
      setManifest(res.data);
      setPvcExpandDrawerOpen(false);
      await fetchManifest();
    } finally {
      setActionLoading(undefined);
    }
  };

  const waitForPodResizeResult = async (
    containerName: string,
    expectedResources: API.ClusterNodePodContainerResources,
    pollingId: number,
  ) => {
    if (!namespace || !name) {
      return;
    }

    for (let count = 0; count < 30; count += 1) {
      const res = await getClusterResourceManifest({
        type: 'Pod',
        namespace,
        name,
      });
      if (podResizePollingRef.current !== pollingId) {
        return;
      }

      const nextManifest = res.data;
      const nextPod = buildPodDetail(nextManifest);
      const nextContainer = nextPod?.containers?.find(
        (item) => item.name === containerName,
      );

      setManifest(nextManifest);

      if (!nextPod || !nextContainer) {
        return;
      }

      const resizeStatus = getPodResizeStatus(nextPod, {
        ...nextContainer,
        resources: expectedResources,
      });
      const resizeMessage = getPodResizeMessage(nextPod);

      if (resizeStatus === 'synced') {
        message.success('容器资源调整已生效');
        return;
      }
      if (resizeStatus === 'infeasible') {
        message.error(resizeMessage || '资源调整不可行，请检查节点可用资源');
        return;
      }
      if (resizeStatus === 'deferred') {
        message.warning(
          resizeMessage || '资源调整已提交，等待节点资源释放后重试',
        );
        return;
      }
      if (resizeStatus === 'error') {
        message.error(resizeMessage || '资源调整失败，请查看容器组事件');
        return;
      }

      await sleep(2000);
      if (podResizePollingRef.current !== pollingId) {
        return;
      }
    }

    message.info('资源调整请求已提交，当前仍在等待 kubelet 应用');
  };

  const handleResizePodResources = async (
    container: API.ClusterNodePodContainer,
    values: PodResizeFormValues,
  ) => {
    if (detailType !== 'Pod' || !namespace || !name || !container.name) {
      return;
    }

    const patch = buildPodResizePatch(container.name, values);
    const expectedResources = buildContainerResourcesFromForm(values);
    const pollingId = podResizePollingRef.current + 1;
    podResizePollingRef.current = pollingId;

    setActionLoading('podResize');
    try {
      const res = await resizeClusterPodResources({
        namespace,
        name,
        patch,
      });
      message.success('资源调整请求已提交');
      if (res.data) {
        setManifest(res.data);
      }
      setPodResizeDrawerOpen(false);
      setResizeContainer(undefined);
      void waitForPodResizeResult(
        container.name,
        expectedResources,
        pollingId,
      ).catch(() => {
        if (podResizePollingRef.current === pollingId) {
          message.error('资源调整状态刷新失败，请稍后手动刷新');
        }
      });
    } finally {
      setActionLoading(undefined);
    }
  };

  const handleSetDefaultStorageClass = () => {
    if (type !== 'StorageClass' || !name || !manifest) {
      return;
    }

    modal.confirm({
      title: '确认设置为默认存储类吗？',
      content: '设置后，未指定存储类的持久卷声明将默认使用该存储类。',
      okText: '设置',
      cancelText: '取消',
      onOk: async () => {
        setActionLoading('storageClassDefault');
        try {
          const storageClassRes = await getClusterStorageClassList({
            limit: 500,
          });
          const storageClassNames = (storageClassRes.data.items || [])
            .map((item) => item.name)
            .filter((item) => item && item !== name);

          const storageClassManifests = await Promise.all(
            storageClassNames.map(async (storageClassName) => {
              const res = await getClusterResourceManifest({
                type: 'StorageClass',
                name: storageClassName,
              });

              return res.data;
            }),
          );
          const defaultManifests = storageClassManifests.filter(
            (item): item is Record<string, unknown> =>
              Boolean(item && isDefaultStorageClass(item)),
          );

          await Promise.all(
            defaultManifests.map((item) => {
              const metadataRecord = getRecordValue(item.metadata);
              const storageClassName = getStringValue(metadataRecord?.name);

              if (!storageClassName) {
                return Promise.resolve();
              }

              return updateClusterResourceManifest({
                type: 'StorageClass',
                name: storageClassName,
                manifest: applyStorageClassDefault(item, false),
              });
            }),
          );

          const res = await updateClusterResourceManifest({
            type: 'StorageClass',
            name,
            manifest: applyStorageClassDefault(manifest, true),
          });
          message.success('默认存储类已设置');
          setManifest(res.data);
          await fetchManifest();
        } finally {
          setActionLoading(undefined);
        }
      },
    });
  };

  const handleUpdateStorageClassVolumeOperations = async (
    values: StorageClassVolumeOperationFormValues,
  ) => {
    if (type !== 'StorageClass' || !name || !manifest) {
      return;
    }

    setActionLoading('storageClassVolumeOperations');
    try {
      const res = await updateClusterResourceManifest({
        type: 'StorageClass',
        name,
        manifest: applyStorageClassVolumeOperations(manifest, values),
      });
      message.success('卷操作已更新');
      setManifest(res.data);
      setStorageClassVolumeOperationModalOpen(false);
      await fetchManifest();
    } finally {
      setActionLoading(undefined);
    }
  };

  const openIngressAnnotationModal = () => {
    const currentAnnotations = getRecordValue(metadata?.annotations) as
      | Record<string, unknown>
      | undefined;
    const rows = Object.entries(currentAnnotations || {}).map(
      ([keyName, value]) => createKeyValueItem(keyName, String(value ?? '')),
    );

    setIngressAnnotationRows(rows.length > 0 ? rows : [createKeyValueItem()]);
    setIngressAnnotationModalOpen(true);
  };

  const openPodResizeDrawer = (container: API.ClusterNodePodContainer) => {
    setResizeContainer(container);
    setPodResizeDrawerOpen(true);
  };

  const handleSaveIngressAnnotations = async () => {
    if (!manifest) {
      return;
    }

    const nextAnnotations: Record<string, string> = {};
    const annotationKeys = new Set<string>();

    for (const row of ingressAnnotationRows) {
      const keyName = row.keyName.trim();
      const value = row.value.trim();

      if (!keyName && !value) {
        continue;
      }
      if (!keyName) {
        message.warning('注解 Key 不能为空');
        return;
      }
      if (annotationKeys.has(keyName)) {
        message.warning('注解 Key 不能重复');
        return;
      }

      annotationKeys.add(keyName);
      nextAnnotations[keyName] = value;
    }

    const nextMetadata: Record<string, unknown> = {
      ...(getRecordValue(manifest.metadata) || {}),
      annotations: nextAnnotations,
    };

    if (Object.keys(nextAnnotations).length === 0) {
      delete nextMetadata.annotations;
    }

    await handleUpdateIngressManifest(
      {
        ...manifest,
        metadata: nextMetadata,
      },
      'ingressAnnotations',
      '注解已更新',
    );
  };

  const openYamlDrawer = async () => {
    if (!detailParams) {
      return;
    }

    setYamlDrawerOpen(true);
    setActionLoading('yaml');
    try {
      const res = await getClusterResourceManifest(detailParams);
      setYamlValue(stringify(res.data || {}, { indent: 2 }));
    } finally {
      setActionLoading(undefined);
    }
  };

  const handleSaveYaml = async () => {
    if (!detailParams) {
      return;
    }

    let nextManifest: unknown;

    try {
      nextManifest = parse(yamlValue);
    } catch {
      message.error('YAML 格式不正确，请检查后重试');
      return;
    }

    if (
      !nextManifest ||
      typeof nextManifest !== 'object' ||
      Array.isArray(nextManifest)
    ) {
      message.error('YAML 内容必须是有效的资源对象');
      return;
    }

    const resource = nextManifest as Record<string, unknown>;
    const metadataRecord = getRecordValue(resource.metadata);
    const manifestName = getStringValue(metadataRecord?.name) || '';
    const manifestNamespace = getStringValue(metadataRecord?.namespace) || '';
    const kind = getStringValue(resource.kind) || '';
    const expectedNamespaced = namespacedResourceTypes.has(detailParams.type);

    if (manifestName !== detailParams.name) {
      message.error('YAML metadata.name 必须与当前资源一致');
      return;
    }
    if (
      expectedNamespaced &&
      manifestNamespace !== (detailParams.namespace || '')
    ) {
      message.error('YAML metadata.namespace 必须与当前资源一致');
      return;
    }
    if (kind !== detailParams.type) {
      message.error(`YAML kind 必须为 ${detailParams.type}`);
      return;
    }

    setActionLoading('yaml');
    try {
      const res = await updateClusterResourceManifest({
        ...detailParams,
        manifest: resource,
      });
      message.success('资源 YAML 已更新');
      setManifest(res.data);
      setYamlDrawerOpen(false);
      await fetchManifest();
    } finally {
      setActionLoading(undefined);
    }
  };

  const handleDelete = () => {
    if (!detailParams) {
      return;
    }

    modal.confirm({
      title: `确认删除该${resourceTypeLabels[detailParams.type]}吗？`,
      content: '删除后资源将被移除，请谨慎操作。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: {
        danger: true,
      },
      onOk: async () => {
        setActionLoading('delete');
        try {
          await deleteClusterResource(detailParams);
          message.success('资源已删除');
          history.push(resourceListPaths[detailParams.type]);
        } finally {
          setActionLoading(undefined);
        }
      },
    });
  };

  const title = name || '资源详情';
  const tabItems = useMemo(() => {
    const metadataTab = {
      key: 'metadata',
      label: '元数据',
      children: (
        <ClusterMetadata
          labels={
            getRecordValue(metadata?.labels) as
              | Record<string, string>
              | undefined
          }
          annotations={
            getRecordValue(metadata?.annotations) as
              | Record<string, string>
              | undefined
          }
        />
      ),
    };
    const eventsTab = {
      key: 'events',
      label: '事件',
      children: (
        <ClusterEventTable
          disabled={!name || !namespace}
          params={{
            objectKind: detailType,
            objectName: name,
            namespace,
          }}
        />
      ),
    };

    if (detailType === 'CronJob') {
      return [
        {
          key: 'runs',
          label: '运行记录',
          children: <JobRunRecords revisions={annotations?.revisions} />,
        },
        metadataTab,
        eventsTab,
      ];
    }

    if (detailType === 'Pod') {
      return [
        {
          key: 'resourceStatus',
          label: '资源状态',
          children: (
            <PodResourceStatus pod={podDetail} onResize={openPodResizeDrawer} />
          ),
        },
        {
          key: 'scheduling',
          label: '调度信息',
          children: (
            <PodSchedulingInfo conditions={podConditions} pod={podDetail} />
          ),
        },
        metadataTab,
        {
          key: 'env',
          label: '环境变量',
          children: <JobEnvironmentVariables manifest={manifest} />,
        },
        eventsTab,
      ];
    }

    if (detailType === 'Service') {
      return [
        {
          key: 'resourceStatus',
          label: '资源状态',
          children: (
            <ServiceResourceStatus
              podLoading={podLoading || workloadLoading}
              pods={pods}
              ports={servicePorts}
              workloads={serviceWorkloads}
              onRefreshPods={fetchPods}
            />
          ),
        },
        metadataTab,
        eventsTab,
      ];
    }

    if (detailType === 'Ingress') {
      return [
        {
          key: 'resourceStatus',
          label: '资源状态',
          children: <IngressResourceStatus rules={ingressRules} />,
        },
        metadataTab,
        eventsTab,
      ];
    }

    if (detailType === 'PersistentVolumeClaim') {
      return [
        {
          key: 'resourceStatus',
          label: '资源状态',
          children: (
            <PersistentVolumeClaimResourceStatus
              loading={podLoading}
              pods={pods}
              onRefresh={fetchPods}
            />
          ),
        },
        metadataTab,
        eventsTab,
      ];
    }

    if (detailType === 'StorageClass') {
      return [
        {
          key: 'persistentVolumeClaims',
          label: '持久卷声明',
          children: <PersistentVolumeClaimTable storageClassName={name} />,
        },
      ];
    }

    if (detailType === 'CustomResourceDefinition') {
      return [
        {
          key: 'customResources',
          label: '定制资源定义',
          children: (
            <CustomResourceTable
              version={customResourceDefinitionVersions[0]}
            />
          ),
        },
      ];
    }

    if (detailType === 'ConfigMap') {
      return [
        {
          key: 'data',
          label: '数据',
          children: <ResourceDataFields items={configMapDataItems} />,
        },
      ];
    }

    if (detailType === 'Secret') {
      return [
        {
          key: 'data',
          label: '数据',
          children: <SecretResourceData data={secretData} />,
        },
      ];
    }

    return [
      {
        key: 'runs',
        label: '运行记录',
        children: <JobRunRecords revisions={annotations?.revisions} />,
      },
      {
        key: 'resourceStatus',
        label: '资源状态',
        children: (
          <JobResourceStatus
            loading={podLoading}
            pods={pods}
            onRefresh={fetchPods}
          />
        ),
      },
      metadataTab,
      {
        key: 'env',
        label: '环境变量',
        children: <JobEnvironmentVariables manifest={manifest} />,
      },
      eventsTab,
    ];
  }, [
    annotations?.revisions,
    fetchPods,
    manifest,
    metadata,
    name,
    namespace,
    podLoading,
    podConditions,
    podDetail,
    pods,
    serviceEndpoints,
    configMapDataItems,
    customResourceDefinitionVersions,
    secretData,
    ingressRules,
    servicePorts,
    serviceWorkloads,
    workloadLoading,
    detailType,
  ]);

  return (
    <PageContainer
      title={title}
      extra={[
        <Dropdown
          disabled={!detailParams}
          key="resource-actions"
          menu={{
            items: resourceActionItems,
            onClick: ({ key }) => {
              if (key === 'yaml') {
                openYamlDrawer();
              }
              if (key === 'rerun') {
                handleRerunJob();
              }
              if (key === 'cronJobSuspend') {
                handleToggleCronJobSuspend();
              }
              if (key === 'serviceSettings') {
                setServiceSettingsDrawerOpen(true);
              }
              if (key === 'serviceExternalAccess') {
                setServiceExternalAccessDrawerOpen(true);
              }
              if (key === 'ingressRules') {
                setIngressRouteRulesDrawerOpen(true);
                void fetchIngressServiceOptions();
              }
              if (key === 'ingressAnnotations') {
                openIngressAnnotationModal();
              }
              if (key === 'configMapSettings') {
                setConfigMapSettingsDrawerOpen(true);
              }
              if (key === 'secretSettings') {
                setSecretSettingsDrawerOpen(true);
              }
              if (key === 'pvcClone') {
                setPvcCloneDrawerOpen(true);
              }
              if (key === 'pvcExpand') {
                setPvcExpandDrawerOpen(true);
              }
              if (key === 'storageClassDefault') {
                handleSetDefaultStorageClass();
              }
              if (key === 'storageClassVolumeOperations') {
                setStorageClassVolumeOperationModalOpen(true);
              }
              if (key === 'delete') {
                handleDelete();
              }
            },
          }}
          trigger={['click']}
        >
          <Button disabled={!detailParams} loading={Boolean(actionLoading)}>
            操作
            <DownOutlined />
          </Button>
        </Dropdown>,
      ]}
      onBack={() => {
        history.back();
      }}
    >
      <div>
        <SectionTitle>基本信息</SectionTitle>
        <div className={styles.content}>
          <Spin spinning={loading}>
            {manifest ? (
              <div className={styles.basicInfoContent}>
                {detailType === 'Job' && (
                  <ReplicaSummary
                    loading={scaling}
                    data={replicaSummary}
                    onScale={handleScaleJobReplicas}
                  />
                )}
                {detailType === 'Pod' ? (
                  <ResourceBasicInfo<PodBasicInfo>
                    className={styles.description}
                    column={3}
                    columns={podBasicInfoColumns}
                    dataSource={basicInfo as PodBasicInfo}
                  />
                ) : detailType === 'Service' ? (
                  <ResourceBasicInfo<ServiceBasicInfo>
                    className={styles.description}
                    column={3}
                    columns={serviceBasicInfoColumns}
                    dataSource={basicInfo as ServiceBasicInfo}
                  />
                ) : detailType === 'ServiceAccount' ? (
                  <ResourceBasicInfo<ServiceAccountBasicInfo>
                    className={styles.description}
                    column={2}
                    columns={serviceAccountBasicInfoColumns}
                    dataSource={basicInfo as ServiceAccountBasicInfo}
                  />
                ) : detailType === 'Secret' ? (
                  <ResourceBasicInfo<SecretBasicInfo>
                    className={styles.description}
                    column={3}
                    columns={secretBasicInfoColumns}
                    dataSource={basicInfo as SecretBasicInfo}
                  />
                ) : detailType === 'Ingress' ? (
                  <ResourceBasicInfo<IngressBasicInfo>
                    className={styles.description}
                    column={2}
                    columns={ingressBasicInfoColumns}
                    dataSource={basicInfo as IngressBasicInfo}
                  />
                ) : detailType === 'ConfigMap' ? (
                  <ResourceBasicInfo<ConfigMapBasicInfo>
                    className={styles.description}
                    column={2}
                    columns={configMapBasicInfoColumns}
                    dataSource={basicInfo as ConfigMapBasicInfo}
                  />
                ) : detailType === 'PersistentVolumeClaim' ? (
                  <ResourceBasicInfo<PersistentVolumeClaimBasicInfo>
                    className={styles.description}
                    column={3}
                    columns={persistentVolumeClaimBasicInfoColumns}
                    dataSource={basicInfo as PersistentVolumeClaimBasicInfo}
                  />
                ) : detailType === 'CustomResourceDefinition' ? (
                  <ResourceBasicInfo<CustomResourceDefinitionBasicInfo>
                    className={styles.description}
                    column={2}
                    columns={customResourceDefinitionBasicInfoColumns}
                    dataSource={basicInfo as CustomResourceDefinitionBasicInfo}
                  />
                ) : detailType === 'StorageClass' ? (
                  <ResourceBasicInfo<StorageClassBasicInfo>
                    className={styles.description}
                    column={3}
                    columns={storageClassBasicInfoColumns}
                    dataSource={basicInfo as StorageClassBasicInfo}
                  />
                ) : detailType === 'CronJob' ? (
                  <ResourceBasicInfo<CronJobBasicInfo>
                    className={styles.description}
                    column={3}
                    columns={cronJobBasicInfoColumns}
                    dataSource={basicInfo as CronJobBasicInfo}
                  />
                ) : (
                  <ResourceBasicInfo<JobBasicInfo>
                    className={styles.description}
                    columns={jobBasicInfoColumns}
                    dataSource={basicInfo as JobBasicInfo}
                  />
                )}
              </div>
            ) : (
              <Empty description="暂无资源详情" />
            )}
          </Spin>
        </div>
      </div>
      {detailType !== 'ServiceAccount' && (
        <div className={styles.moreInfo}>
          <Card className={`${styles.moreInfoCard} ${styles.tabBody}`}>
            <Tabs items={tabItems} />
          </Card>
        </div>
      )}
      <Drawer
        title={
          <>
            <FileTextOutlined /> 编辑当前资源 YAML
          </>
        }
        destroyOnHidden
        footer={
          <div className={styles.yamlDrawerFooter}>
            <Button onClick={() => setYamlDrawerOpen(false)}>取消</Button>
            <Button
              loading={actionLoading === 'yaml'}
              type="primary"
              onClick={handleSaveYaml}
            >
              确定
            </Button>
          </div>
        }
        open={yamlDrawerOpen}
        width="65vw"
        onClose={() => setYamlDrawerOpen(false)}
      >
        <Spin spinning={actionLoading === 'yaml' && !yamlValue}>
          <div className={styles.yamlDrawerBody}>
            <div className={styles.yamlDrawerEditor}>
              <YamlEditor
                height="calc(100vh - 154px)"
                value={yamlValue}
                onChange={setYamlValue}
              />
            </div>
          </div>
        </Spin>
      </Drawer>
      <ServiceSettingsEditDrawer
        loading={actionLoading === 'serviceSettings'}
        manifest={manifest}
        open={serviceSettingsDrawerOpen}
        onCancel={() => setServiceSettingsDrawerOpen(false)}
        onSubmit={(patch) =>
          handleUpdateServicePatch(patch, 'serviceSettings', '服务已更新')
        }
      />
      <ServiceExternalAccessEditDrawer
        loading={actionLoading === 'serviceExternalAccess'}
        manifest={manifest}
        open={serviceExternalAccessDrawerOpen}
        onCancel={() => setServiceExternalAccessDrawerOpen(false)}
        onSubmit={(patch) =>
          handleUpdateServicePatch(
            patch,
            'serviceExternalAccess',
            '外部访问已更新',
          )
        }
      />
      <IngressRouteRulesEditDrawer
        loading={actionLoading === 'ingressRules'}
        manifest={manifest}
        namespace={namespace}
        open={ingressRouteRulesDrawerOpen}
        serviceOptions={ingressServiceOptions}
        onCancel={() => setIngressRouteRulesDrawerOpen(false)}
        onSubmit={(nextManifest) =>
          handleUpdateIngressManifest(
            nextManifest,
            'ingressRules',
            '路由规则已更新',
          )
        }
      />
      <IngressAnnotationsEditDrawer
        loading={actionLoading === 'ingressAnnotations'}
        open={ingressAnnotationModalOpen}
        rows={ingressAnnotationRows}
        onCancel={() => setIngressAnnotationModalOpen(false)}
        onChange={setIngressAnnotationRows}
        onSubmit={handleSaveIngressAnnotations}
      />
      <SecretSettingsEditDrawer
        loading={actionLoading === 'secretSettings'}
        manifest={manifest}
        namespace={namespace}
        open={secretSettingsDrawerOpen}
        onCancel={() => setSecretSettingsDrawerOpen(false)}
        onSubmit={handleUpdateSecretManifest}
      />
      <ConfigMapSettingsEditDrawer
        loading={actionLoading === 'configMapSettings'}
        manifest={manifest}
        namespace={namespace}
        open={configMapSettingsDrawerOpen}
        onCancel={() => setConfigMapSettingsDrawerOpen(false)}
        onSubmit={handleUpdateConfigMapManifest}
      />
      <PodResizeDrawer
        container={resizeContainer}
        loading={actionLoading === 'podResize'}
        open={podResizeDrawerOpen}
        pod={podDetail}
        onCancel={() => {
          setPodResizeDrawerOpen(false);
          setResizeContainer(undefined);
        }}
        onSubmit={handleResizePodResources}
      />
      <PersistentVolumeClaimCloneDrawer
        currentSizeGi={persistentVolumeClaimSizeGi}
        loading={actionLoading === 'pvcClone'}
        manifest={manifest}
        open={pvcCloneDrawerOpen}
        onCancel={() => setPvcCloneDrawerOpen(false)}
        onSubmit={handleClonePersistentVolumeClaim}
      />
      <PersistentVolumeClaimExpandDrawer
        currentSizeGi={persistentVolumeClaimSizeGi}
        loading={actionLoading === 'pvcExpand'}
        manifest={manifest}
        open={pvcExpandDrawerOpen}
        onCancel={() => setPvcExpandDrawerOpen(false)}
        onSubmit={handleExpandPersistentVolumeClaim}
      />
      <StorageClassVolumeOperationModal
        loading={actionLoading === 'storageClassVolumeOperations'}
        open={storageClassVolumeOperationModalOpen}
        values={storageClassVolumeOperations}
        onCancel={() => setStorageClassVolumeOperationModalOpen(false)}
        onSubmit={handleUpdateStorageClassVolumeOperations}
      />
    </PageContainer>
  );
};

export default ClusterResourceDetail;
