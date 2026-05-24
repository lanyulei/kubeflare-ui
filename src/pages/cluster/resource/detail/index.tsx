import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { App, Card, Empty, Spin, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClusterEventTable,
  ClusterMetadata,
  ReplicaSummary,
  SectionTitle,
} from '@/components';
import { getClusterNodePodList } from '@/services/kubeflare/cluster/node';
import {
  getClusterResourceManifest,
  updateClusterJobReplicas,
} from '@/services/kubeflare/cluster/resource';
import {
  formatValue,
  getArrayValue,
  getNumberValue,
  getRecordValue,
  getStringValue,
} from './components/helpers';
import JobEnvironmentVariables from './components/JobEnvironmentVariables';
import JobResourceStatus from './components/JobResourceStatus';
import JobRunRecords from './components/JobRunRecords';
import PodResourceStatus from './components/PodResourceStatus';
import PodSchedulingInfo from './components/PodSchedulingInfo';
import {
  buildPodBasicInfo,
  buildPodConditions,
  buildPodDetail,
  type PodBasicInfo,
} from './components/podHelpers';
import ResourceBasicInfo from './components/ResourceBasicInfo';
import StatusText from './components/StatusText';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';

const resourceTypeLabels: Record<API.ClusterResourceCreateType, string> = {
  Job: '任务',
  CronJob: '定时任务',
  Pod: '容器组',
  Service: '服务',
  Ingress: '应用路由',
  Secret: '保密字典',
  ConfigMap: '配置字典',
  ServiceAccount: '服务账户',
  CustomResourceDefinition: '定制资源定义',
  PersistentVolumeClaim: '持久卷声明',
  StorageClass: '存储类',
};

const resourceTypes = Object.keys(
  resourceTypeLabels,
) as API.ClusterResourceCreateType[];

const useStyles = createStyles(({ token }) => ({
  content: {
    backgroundColor: token.colorBgContainer,
    border: `1px solid ${token.colorBorder}80`,
    borderRadius: token.borderRadiusLG,
    padding: 20,
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
}));

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
    title: 'QoS 类别',
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
  const { message } = App.useApp();
  const { styles } = useStyles();
  const params = useParams<{
    type?: string;
    namespace?: string;
    name?: string;
  }>();
  const type = isResourceType(params.type) ? params.type : undefined;
  const namespace = params.namespace === '-' ? undefined : params.namespace;
  const name = params.name;
  const [loading, setLoading] = useState(false);
  const [podLoading, setPodLoading] = useState(false);
  const [scaling, setScaling] = useState(false);
  const [manifest, setManifest] = useState<Record<string, unknown>>();
  const [detailType, setDetailType] = useState<
    API.ClusterResourceCreateType | undefined
  >(type);
  const [pods, setPods] = useState<API.ClusterNodePodItem[]>([]);
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
        : detailType === 'CronJob'
          ? buildCronJobBasicInfo(manifest, namespace)
          : buildJobBasicInfo(manifest, namespace),
    [detailType, manifest, namespace],
  );
  const podDetail = useMemo(() => buildPodDetail(manifest), [manifest]);
  const podConditions = useMemo(() => buildPodConditions(manifest), [manifest]);
  const replicaSummary = useMemo(
    () => buildJobReplicaSummary(manifest),
    [manifest],
  );

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
    if (type !== 'Job' || !namespace || !name) {
      setPods([]);
      return;
    }

    setPodLoading(true);
    try {
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
  }, [name, namespace, type]);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  useEffect(() => {
    fetchPods();
  }, [fetchPods]);

  useEffect(() => {
    const refresh = () => {
      void fetchManifest();
      void fetchPods();
    };

    window.addEventListener(CURRENT_CLUSTER_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener(CURRENT_CLUSTER_CHANGE_EVENT, refresh);
    };
  }, [fetchManifest, fetchPods]);

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
          children: <PodResourceStatus pod={podDetail} />,
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
    detailType,
  ]);

  return (
    <PageContainer
      title={title}
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
      <div className={styles.moreInfo}>
        <Card className={`${styles.moreInfoCard} ${styles.tabBody}`}>
          <Tabs items={tabItems} />
        </Card>
      </div>
    </PageContainer>
  );
};

export default ClusterResourceDetail;
