import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
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

const buildJobReplicaSummary = (
  manifest?: Record<string, unknown>,
  pods: API.ClusterNodePodItem[] = [],
) => {
  const spec = getRecordValue(manifest?.spec);
  const status = getRecordValue(manifest?.status);
  const parallelism = getNumberValue(spec?.parallelism);
  const activePods = getNumberValue(status?.active);

  return {
    desiredReplicas: parallelism ?? 1,
    currentReplicas: activePods ?? pods.length,
    scalable: Boolean(manifest),
  };
};

const getJobPodSelectors = (name?: string) =>
  name ? [`batch.kubernetes.io/job-name=${name}`, `job-name=${name}`] : [];

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
    () => buildJobBasicInfo(manifest, namespace),
    [manifest, namespace],
  );
  const replicaSummary = useMemo(
    () => buildJobReplicaSummary(manifest, pods),
    [manifest, pods],
  );

  const fetchManifest = useCallback(async () => {
    if (!type || !name) {
      setManifest(undefined);
      return;
    }

    setLoading(true);
    try {
      const res = await getClusterResourceManifest({
        type,
        namespace,
        name,
      });
      setManifest(res.data);
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
  const resourceLabel = type ? resourceTypeLabels[type] : '-';

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
                {type === 'Job' && (
                  <ReplicaSummary
                    loading={scaling}
                    data={replicaSummary}
                    onScale={handleScaleJobReplicas}
                  />
                )}
                <ProDescriptions
                  className={styles.description}
                  column={2}
                  dataSource={{
                    type: resourceLabel,
                    name: metadata?.name || name,
                    namespace: basicInfo.namespace,
                    status: basicInfo.status,
                    uid: metadata?.uid,
                    backoff_limit: basicInfo.backoff_limit,
                    completions: basicInfo.completions,
                    parallelism: basicInfo.parallelism,
                    active_deadline_seconds: basicInfo.active_deadline_seconds,
                  }}
                  columns={[
                    {
                      title: '命名空间',
                      dataIndex: 'namespace',
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      render: (_, record) => (
                        <StatusText status={record.status} />
                      ),
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
                  ]}
                />
              </div>
            ) : (
              <Empty description="暂无资源详情" />
            )}
          </Spin>
        </div>
      </div>
      <div className={styles.moreInfo}>
        <Card className={`${styles.moreInfoCard} ${styles.tabBody}`}>
          <Tabs
            items={[
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
              {
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
              },
              {
                key: 'env',
                label: '环境变量',
                children: <JobEnvironmentVariables manifest={manifest} />,
              },
              {
                key: 'events',
                label: '事件',
                children: (
                  <ClusterEventTable
                    disabled={!name || !namespace}
                    params={{
                      objectKind: type,
                      objectName: name,
                      namespace,
                    }}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </PageContainer>
  );
};

export default ClusterResourceDetail;
