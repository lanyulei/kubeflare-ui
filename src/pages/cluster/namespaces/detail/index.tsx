import {
  ApartmentOutlined,
  ApiOutlined,
  AppstoreOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  FieldTimeOutlined,
  HddOutlined,
  PlaySquareOutlined,
} from '@ant-design/icons';
import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { history, useIntl, useParams } from '@umijs/max';
import { Button, Card, Empty, Spin, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClusterMetadata, ClusterPodList, SectionTitle } from '@/components';
import {
  getClusterNamespaceDetail,
  getClusterNamespacePodList,
  getClusterNamespaceQuotaSummary,
  getClusterNamespaceResourceStatus,
} from '@/services/kubeflare/cluster/namespace';

const useStyles = createStyles(({ token }) => ({
  content: {
    backgroundColor: token.colorBgContainer,
    border: `1px solid ${token.colorBorder}80`,
    borderRadius: token.borderRadiusLG,
    padding: 20,
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
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  statusDotDefault: {
    backgroundColor: token.colorTextQuaternary,
  },
  statusDotSuccess: {
    backgroundColor: token.colorSuccess,
  },
  statusDotWarning: {
    backgroundColor: token.colorWarning,
  },
  overview: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorBgContainer,
    overflow: 'hidden',

    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  resourceItem: {
    display: 'grid',
    gridTemplateColumns: '52px 1fr',
    alignItems: 'center',
    minHeight: 62,
    backgroundColor: token.colorFillQuaternary,
    transition: `background-color ${token.motionDurationMid}`,

    '&:hover': {
      backgroundColor: token.colorFillSecondary,
    },
  },
  resourceIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#34465a',
    fontSize: 24,
  },
  resourceContent: {
    minWidth: 0,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
  },
  resourceCount: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.4,
  },
  resourceCountActive: {
    color: token.colorSuccess,
  },
  resourceLabel: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resourceSpin: {
    '.ant-spin-container': {
      minHeight: 0,
    },
  },
  quotaPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  defaultQuota: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginLG,
    padding: `8px 5px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  defaultQuotaGroup: {
    display: 'grid',
    gridTemplateColumns: '52px 1fr 1fr',
    alignItems: 'center',
    minHeight: 48,
  },
  quotaIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#34465a',
    fontSize: 26,
  },
  quotaMetric: {
    minWidth: 0,
  },
  quotaMetricValue: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  quotaMetricLabel: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  projectQuota: {
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorFillQuaternary,
  },
  projectQuotaItem: {
    display: 'grid',
    gridTemplateColumns: '64px 180px 180px 180px 1fr',
    alignItems: 'center',
    minHeight: 70,
    padding: `0 ${token.padding}px 0 0`,
    transition: `background-color ${token.motionDurationMid}`,

    '&:hover': {
      backgroundColor: token.colorFillSecondary,
    },

    '@media (max-width: 1200px)': {
      gridTemplateColumns: '56px 1fr 1fr',
      rowGap: token.marginSM,
      padding: `${token.paddingSM}px ${token.padding}px`,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '48px 1fr',
    },
  },
  quotaUsage: {
    minWidth: 0,

    '@media (max-width: 1200px)': {
      gridColumn: '2 / 4',
    },

    '@media (max-width: 768px)': {
      gridColumn: '2 / 3',
    },
  },
  usageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: token.marginSM,
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  usageTitle: {
    color: token.colorText,
    fontSize: 14,
    // fontWeight: 600,
  },
  usageBar: {
    position: 'relative',
    height: 18,
    marginTop: 4,
    overflow: 'hidden',
    borderRadius: 0,
    backgroundColor: token.colorFillSecondary,
  },
  usageBarInner: {
    height: '100%',
    backgroundColor: token.colorPrimary,
  },
  usageLimit: {
    position: 'absolute',
    top: 0,
    right: token.paddingSM,
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: '18px',
  },
}));

const DEFAULT_RESOURCE_STATUS: API.ClusterNamespaceResourceStatus = {
  pods: 0,
  deployments: 0,
  statefulsets: 0,
  daemonsets: 0,
  jobs: 0,
  cronjobs: 0,
  persistentVolumeClaims: 0,
  services: 0,
  ingresses: 0,
};

const DEFAULT_QUOTA_SUMMARY: API.ClusterNamespaceQuotaSummary = {
  defaultContainer: {},
  project: {
    cpuLimit: {},
    memoryLimit: {},
    pods: {},
    deployments: {},
    persistentVolumeClaims: {},
  },
};

const getNamespaceStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'active') {
    return '运行中';
  }
  if (normalizedStatus === 'terminating') {
    return '删除中';
  }
  return status || '-';
};

const getNamespaceStatusType = (
  status?: string,
): 'default' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'active') {
    return 'success';
  }
  if (normalizedStatus === 'terminating') {
    return 'warning';
  }
  return 'default';
};

const formatCreateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : value;
};

const decodeNamespaceName = (name?: string) => {
  if (!name) {
    return '';
  }

  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};

const formatQuotaValue = (value?: string) => value || '无上限';

const parseCpuQuantity = (value?: string) => {
  if (!value) {
    return undefined;
  }
  if (value.endsWith('m')) {
    return Number(value.replace('m', '')) / 1000;
  }
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
};

const parseMemoryQuantity = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const matched = value.match(/^([\d.]+)(Ki|Mi|Gi|Ti|K|M|G|T)?$/);
  if (!matched) {
    return undefined;
  }

  const amount = Number(matched[1]);
  const unit = matched[2];
  const unitMap: Record<string, number> = {
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
    K: 1000,
    M: 1000 ** 2,
    G: 1000 ** 3,
    T: 1000 ** 4,
  };

  if (!Number.isFinite(amount)) {
    return undefined;
  }
  return amount * (unit ? unitMap[unit] : 1);
};

const parseCountQuantity = (value?: string) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
};

const getQuotaUsagePercent = (
  used?: string,
  hard?: string,
  parser: (value?: string) => number | undefined = parseCountQuantity,
) => {
  const usedValue = parser(used);
  const hardValue = parser(hard);

  if (!usedValue || !hardValue || hardValue <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((usedValue / hardValue) * 100));
};

const NamespaceDetail = () => {
  const intl = useIntl();
  const params = useParams<{ name?: string }>();
  const { styles } = useStyles();
  const [loading, setLoading] = useState(false);
  const [namespace, setNamespace] = useState<API.ClusterNamespaceItem>();
  const [podLoading, setPodLoading] = useState(false);
  const [pods, setPods] = useState<API.ClusterNodePodItem[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceStatus, setResourceStatus] =
    useState<API.ClusterNamespaceResourceStatus>(DEFAULT_RESOURCE_STATUS);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaSummary, setQuotaSummary] =
    useState<API.ClusterNamespaceQuotaSummary>(DEFAULT_QUOTA_SUMMARY);
  const namespaceName = useMemo(
    () => decodeNamespaceName(params.name),
    [params.name],
  );
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };

  const fetchNamespace = useCallback(async () => {
    if (!namespaceName) {
      setNamespace(undefined);
      return;
    }

    setLoading(true);
    try {
      const res = await getClusterNamespaceDetail(namespaceName);
      setNamespace(res.data);
    } finally {
      setLoading(false);
    }
  }, [namespaceName]);

  const fetchPods = useCallback(async () => {
    if (!namespaceName) {
      setPods([]);
      return;
    }

    setPodLoading(true);
    try {
      const res = await getClusterNamespacePodList({
        namespace: namespaceName,
      });
      setPods(res.data.items || []);
    } finally {
      setPodLoading(false);
    }
  }, [namespaceName]);

  const fetchResourceStatus = useCallback(async () => {
    if (!namespaceName) {
      setResourceStatus(DEFAULT_RESOURCE_STATUS);
      return;
    }

    setResourceLoading(true);
    try {
      const res = await getClusterNamespaceResourceStatus(namespaceName);
      setResourceStatus(res.data);
    } finally {
      setResourceLoading(false);
    }
  }, [namespaceName]);

  const fetchQuotaSummary = useCallback(async () => {
    if (!namespaceName) {
      setQuotaSummary(DEFAULT_QUOTA_SUMMARY);
      return;
    }

    setQuotaLoading(true);
    try {
      const res = await getClusterNamespaceQuotaSummary(namespaceName);
      setQuotaSummary(res.data);
    } finally {
      setQuotaLoading(false);
    }
  }, [namespaceName]);

  useEffect(() => {
    fetchNamespace();
  }, [fetchNamespace]);

  useEffect(() => {
    fetchPods();
  }, [fetchPods]);

  useEffect(() => {
    fetchResourceStatus();
  }, [fetchResourceStatus]);

  useEffect(() => {
    fetchQuotaSummary();
  }, [fetchQuotaSummary]);

  const resourceStatusItems = [
    {
      key: 'pods',
      label: '容器组',
      value: resourceStatus.pods,
      icon: <ClusterOutlined />,
    },
    {
      key: 'deployments',
      label: '部署',
      value: resourceStatus.deployments,
      icon: <DeploymentUnitOutlined />,
      active: resourceStatus.deployments > 0,
    },
    {
      key: 'statefulsets',
      label: '有状态副本集',
      value: resourceStatus.statefulsets,
      icon: <PlaySquareOutlined />,
    },
    {
      key: 'daemonsets',
      label: '守护进程集',
      value: resourceStatus.daemonsets,
      icon: <ApartmentOutlined />,
    },
    {
      key: 'jobs',
      label: '任务',
      value: resourceStatus.jobs,
      icon: <AppstoreOutlined />,
    },
    {
      key: 'cronjobs',
      label: '定时任务',
      value: resourceStatus.cronjobs,
      icon: <FieldTimeOutlined />,
    },
    {
      key: 'persistentVolumeClaims',
      label: '持久卷声明',
      value: resourceStatus.persistentVolumeClaims,
      icon: <HddOutlined />,
    },
    {
      key: 'services',
      label: '服务',
      value: resourceStatus.services,
      icon: <DatabaseOutlined />,
    },
    {
      key: 'ingresses',
      label: '应用路由',
      value: resourceStatus.ingresses,
      icon: <ApiOutlined />,
    },
  ];
  const defaultQuotaItems = [
    {
      key: 'cpu',
      icon: <DatabaseOutlined />,
      request: quotaSummary.defaultContainer.cpuRequest,
      requestLabel: 'CPU 预留',
      limit: quotaSummary.defaultContainer.cpuLimit,
      limitLabel: 'CPU 限制',
    },
    {
      key: 'memory',
      icon: <HddOutlined />,
      request: quotaSummary.defaultContainer.memoryRequest,
      requestLabel: '内存预留',
      limit: quotaSummary.defaultContainer.memoryLimit,
      limitLabel: '内存上限',
    },
  ];
  const projectQuotaItems = [
    {
      key: 'cpuLimit',
      icon: <DatabaseOutlined />,
      title: 'CPU 上限',
      quota: quotaSummary.project.cpuLimit,
      parser: parseCpuQuantity,
    },
    {
      key: 'memoryLimit',
      icon: <HddOutlined />,
      title: '内存上限',
      quota: quotaSummary.project.memoryLimit,
      parser: parseMemoryQuantity,
    },
    {
      key: 'pods',
      icon: <ClusterOutlined />,
      title: '容器组',
      quota: quotaSummary.project.pods,
    },
    {
      key: 'deployments',
      icon: <DeploymentUnitOutlined />,
      title: '部署',
      quota: quotaSummary.project.deployments,
    },
    {
      key: 'persistentVolumeClaims',
      icon: <HddOutlined />,
      title: '持久卷声明',
      quota: quotaSummary.project.persistentVolumeClaims,
    },
  ];

  const title = namespaceName
    ? intl.formatMessage(
        {
          id: 'pages.cluster.namespaces.detail.title',
          defaultMessage: '命名空间详情：{name}',
        },
        { name: namespaceName },
      )
    : intl.formatMessage({
        id: 'pages.cluster.namespaces.detail',
        defaultMessage: '命名空间详情',
      });

  return (
    <PageContainer
      title={title}
      onBack={() => history.back()}
      extra={[
        <Button key="back" onClick={() => history.back()}>
          {intl.formatMessage({
            id: 'pages.cluster.namespaces.detail.back',
            defaultMessage: '返回',
          })}
        </Button>,
      ]}
    >
      <div>
        <SectionTitle>基本信息</SectionTitle>
        <div className={styles.content}>
          <Spin spinning={loading}>
            {namespaceName ? (
              <ProDescriptions<API.ClusterNamespaceItem>
                column={2}
                dataSource={namespace}
                columns={[
                  {
                    title: intl.formatMessage({
                      id: 'pages.cluster.namespaces.name',
                      defaultMessage: '名称',
                    }),
                    dataIndex: 'name',
                    renderText: (_, record) => record.name || namespaceName,
                  },
                  {
                    title: intl.formatMessage({
                      id: 'pages.cluster.namespaces.status',
                      defaultMessage: '状态',
                    }),
                    dataIndex: 'status',
                    render: (_, record) => {
                      const statusType = getNamespaceStatusType(record.status);

                      return (
                        <span className={styles.status}>
                          <span
                            className={[
                              styles.statusDot,
                              statusDotClassNames[statusType],
                            ].join(' ')}
                          />
                          <span>{getNamespaceStatusLabel(record.status)}</span>
                        </span>
                      );
                    },
                  },
                  {
                    title: intl.formatMessage({
                      id: 'pages.cluster.namespaces.uid',
                      defaultMessage: 'UID',
                    }),
                    dataIndex: 'id',
                    copyable: true,
                    renderText: (value) => value || '-',
                  },
                  {
                    title: intl.formatMessage({
                      id: 'pages.cluster.namespaces.createdAt',
                      defaultMessage: '创建时间',
                    }),
                    dataIndex: 'create_time',
                    renderText: (value) => formatCreateTime(value),
                  },
                ]}
              />
            ) : (
              <Empty
                description={intl.formatMessage({
                  id: 'pages.cluster.namespaces.detail.empty',
                  defaultMessage: '未找到命名空间',
                })}
              />
            )}
          </Spin>
        </div>
      </div>
      <div className={styles.moreInfo}>
        <Card className={styles.moreInfoCard}>
          <Tabs
            items={[
              {
                key: 'overview',
                label: '概览',
                children: (
                  <div>
                    <SectionTitle color={'#36435C'} fontSize={12}>
                      资源状态
                    </SectionTitle>
                    <Spin
                      spinning={resourceLoading}
                      className={styles.resourceSpin}
                    >
                      <div className={styles.overview}>
                        {resourceStatusItems.map((item) => (
                          <div className={styles.resourceItem} key={item.key}>
                            <div className={styles.resourceIcon}>
                              {item.icon}
                            </div>
                            <div className={styles.resourceContent}>
                              <div
                                className={[
                                  styles.resourceCount,
                                  item.active ? styles.resourceCountActive : '',
                                ].join(' ')}
                              >
                                {item.value}
                              </div>
                              <div className={styles.resourceLabel}>
                                {item.label}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Spin>
                  </div>
                ),
              },
              {
                key: 'pods',
                label: '容器组',
                children: (
                  <ClusterPodList
                    dataSource={pods}
                    loading={podLoading}
                    onRefresh={fetchPods}
                  />
                ),
              },
              {
                key: 'quota',
                label: '配额',
                children: (
                  <Spin spinning={quotaLoading}>
                    <div className={styles.quotaPanel}>
                      <div>
                        <SectionTitle color={'#36435C'} fontSize={12}>
                          默认容器配额
                        </SectionTitle>
                        <div className={styles.defaultQuota}>
                          {defaultQuotaItems.map((item) => (
                            <div
                              className={styles.defaultQuotaGroup}
                              key={item.key}
                            >
                              <div className={styles.quotaIcon}>
                                {item.icon}
                              </div>
                              <div className={styles.quotaMetric}>
                                <div className={styles.quotaMetricValue}>
                                  {item.request || '无预留'}
                                </div>
                                <div className={styles.quotaMetricLabel}>
                                  {item.requestLabel}
                                </div>
                              </div>
                              <div className={styles.quotaMetric}>
                                <div className={styles.quotaMetricValue}>
                                  {formatQuotaValue(item.limit)}
                                </div>
                                <div className={styles.quotaMetricLabel}>
                                  {item.limitLabel}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <SectionTitle color={'#36435C'} fontSize={12}>
                          项目配额
                        </SectionTitle>
                        <div className={styles.projectQuota}>
                          {projectQuotaItems.map((item) => {
                            const usagePercent = getQuotaUsagePercent(
                              item.quota.used,
                              item.quota.hard,
                              item.parser,
                            );

                            return (
                              <div
                                className={styles.projectQuotaItem}
                                key={item.key}
                              >
                                <div className={styles.quotaIcon}>
                                  {item.icon}
                                </div>
                                <div className={styles.quotaMetric}>
                                  <div className={styles.quotaMetricValue}>
                                    {item.title}
                                  </div>
                                  <div className={styles.quotaMetricLabel}>
                                    资源类型
                                  </div>
                                </div>
                                <div className={styles.quotaMetric}>
                                  <div className={styles.quotaMetricValue}>
                                    {item.quota.used || '0'}
                                  </div>
                                  <div className={styles.quotaMetricLabel}>
                                    已使用
                                  </div>
                                </div>
                                <div className={styles.quotaMetric}>
                                  <div className={styles.quotaMetricValue}>
                                    {formatQuotaValue(item.quota.hard)}
                                  </div>
                                  <div className={styles.quotaMetricLabel}>
                                    配额
                                  </div>
                                </div>
                                <div className={styles.quotaUsage}>
                                  <div className={styles.usageHeader}>
                                    <span className={styles.usageTitle}>
                                      用量
                                    </span>
                                    <span>已使用：{usagePercent}%</span>
                                  </div>
                                  <div className={styles.usageBar}>
                                    <div
                                      className={styles.usageBarInner}
                                      style={{ width: `${usagePercent}%` }}
                                    />
                                    <span className={styles.usageLimit}>
                                      {formatQuotaValue(item.quota.hard)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Spin>
                ),
              },
              {
                key: 'metadata',
                label: '元数据',
                children: (
                  <ClusterMetadata
                    labels={namespace?.labels}
                    annotations={namespace?.annotations}
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

export default NamespaceDetail;
