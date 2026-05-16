import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { history, useIntl, useParams } from '@umijs/max';
import { App, Empty, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useState } from 'react';
import { SectionTitle } from '@/components';
import {
  getClusterWorkloadDetail,
  updateClusterWorkloadReplicas,
} from '@/services/kubeflare/cluster/workload';
import ContainerReplicas from './components/ContainerReplicas';
import EventTable from './components/EventTable';
import ReplicaSummary from './components/ReplicaSummary';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';

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
    gap: `20px`,
  },
  description: {
    flex: 1,
    minWidth: 420,
  },
  section: {
    marginTop: token.marginLG,
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
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
    boxShadow: `0 0 0 3px ${token.colorFillSecondary}`,
  },
  statusDotError: {
    backgroundColor: token.colorError,
    boxShadow: `0 0 0 3px ${token.colorErrorBg}`,
  },
  statusDotSuccess: {
    backgroundColor: token.colorSuccess,
    boxShadow: `0 0 0 3px ${token.colorSuccessBg}`,
  },
  statusDotWarning: {
    backgroundColor: token.colorWarning,
    boxShadow: `0 0 0 3px ${token.colorWarningBg}`,
  },
}));

const getWorkloadStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'running') {
    return '运行中';
  }
  if (normalizedStatus === 'updating') {
    return '更新中';
  }
  if (normalizedStatus === 'progressing') {
    return '启动中';
  }
  if (normalizedStatus === 'stopped') {
    return '已停止';
  }
  if (normalizedStatus === 'terminating') {
    return '删除中';
  }
  if (
    normalizedStatus === 'unavailable' ||
    normalizedStatus === 'minimumreplicasunavailable'
  ) {
    return '异常';
  }
  return status || '-';
};

const getWorkloadStatusType = (
  status?: string,
): 'default' | 'error' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'running') {
    return 'success';
  }
  if (
    normalizedStatus === 'updating' ||
    normalizedStatus === 'progressing' ||
    normalizedStatus === 'terminating'
  ) {
    return 'warning';
  }
  if (
    normalizedStatus === 'unavailable' ||
    normalizedStatus === 'minimumreplicasunavailable'
  ) {
    return 'error';
  }
  return 'default';
};

const workloadTypeLabels: Record<API.ClusterWorkloadType, string> = {
  Deployment: '部署',
  StatefulSet: '有状态副本集',
  DaemonSet: '守护进程集',
};

const isClusterWorkloadType = (
  type?: string,
): type is API.ClusterWorkloadType =>
  type === 'Deployment' || type === 'StatefulSet' || type === 'DaemonSet';

const WorkloadDetail = () => {
  const { message } = App.useApp();
  const intl = useIntl();
  const { styles } = useStyles();
  const params = useParams<{
    type?: string;
    namespace?: string;
    name?: string;
  }>();
  const type = isClusterWorkloadType(params.type) ? params.type : undefined;
  const namespace = params.namespace;
  const name = params.name;
  const [loading, setLoading] = useState(false);
  const [scaling, setScaling] = useState(false);
  const [workload, setWorkload] = useState<API.ClusterWorkloadItem>();
  const descriptionData =
    workload ||
    (type && namespace && name
      ? ({
          id: `${type}-${namespace}-${name}`,
          name,
          namespace,
          type,
          type_label: workloadTypeLabels[type],
        } as API.ClusterWorkloadItem)
      : undefined);
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    error: styles.statusDotError,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };

  const fetchWorkload = useCallback(async () => {
    if (!type || !namespace || !name) {
      setWorkload(undefined);
      return;
    }

    setLoading(true);
    try {
      const res = await getClusterWorkloadDetail({
        type,
        namespace,
        name,
      });
      setWorkload(res.data);
    } finally {
      setLoading(false);
    }
  }, [name, namespace, type]);

  const handleScaleReplicas = async (replicas: number) => {
    if (!type || !namespace || !name) {
      return;
    }

    setScaling(true);
    try {
      const res = await updateClusterWorkloadReplicas({
        type,
        namespace,
        name,
        replicas,
      });
      message.success('副本数已更新');
      setWorkload(res.data);
      await fetchWorkload();
    } finally {
      setScaling(false);
    }
  };

  useEffect(() => {
    fetchWorkload();

    window.addEventListener(CURRENT_CLUSTER_CHANGE_EVENT, fetchWorkload);
    return () => {
      window.removeEventListener(CURRENT_CLUSTER_CHANGE_EVENT, fetchWorkload);
    };
  }, [fetchWorkload]);

  return (
    <PageContainer
      title={
        name ||
        intl.formatMessage({
          id: 'pages.cluster.workloads.detail',
          defaultMessage: '工作负载详情',
        })
      }
      onBack={() => history.back()}
    >
      <div>
        <SectionTitle>基本信息</SectionTitle>
        <div className={styles.content}>
          <Spin spinning={loading}>
            {descriptionData ? (
              <div className={styles.basicInfoContent}>
                <ReplicaSummary
                  loading={scaling}
                  workload={descriptionData}
                  onScale={handleScaleReplicas}
                />
                <ProDescriptions<API.ClusterWorkloadItem>
                  className={styles.description}
                  column={2}
                  dataSource={descriptionData}
                  columns={[
                    {
                      title: intl.formatMessage({
                        id: 'pages.cluster.workloads.name',
                        defaultMessage: '名称',
                      }),
                      dataIndex: 'name',
                      copyable: true,
                      renderText: (_, record) => record.name || name,
                    },
                    {
                      title: intl.formatMessage({
                        id: 'pages.cluster.workloads.namespace',
                        defaultMessage: '命名空间',
                      }),
                      dataIndex: 'namespace',
                      renderText: (_, record) => record.namespace || namespace,
                    },
                    {
                      title: intl.formatMessage({
                        id: 'pages.cluster.workloads.status',
                        defaultMessage: '状态',
                      }),
                      dataIndex: 'status',
                      render: (_, record) => {
                        const statusType = getWorkloadStatusType(record.status);

                        return (
                          <span className={styles.status}>
                            <span
                              className={[
                                styles.statusDot,
                                statusDotClassNames[statusType],
                              ].join(' ')}
                            />
                            <span>{getWorkloadStatusLabel(record.status)}</span>
                          </span>
                        );
                      },
                    },
                    {
                      title: intl.formatMessage({
                        id: 'pages.cluster.workloads.type',
                        defaultMessage: '类型',
                      }),
                      dataIndex: 'type',
                      renderText: (_, record) =>
                        record.type_label ||
                        workloadTypeLabels[record.type] ||
                        (type ? workloadTypeLabels[type] : '-'),
                    },
                    {
                      title: intl.formatMessage({
                        id: 'pages.cluster.workloads.createTime',
                        defaultMessage: '创建时间',
                      }),
                      dataIndex: 'create_time',
                      valueType: 'dateTime',
                    },
                    {
                      title: intl.formatMessage({
                        id: 'pages.cluster.workloads.updateTime',
                        defaultMessage: '更新时间',
                      }),
                      dataIndex: 'update_time',
                      valueType: 'dateTime',
                      renderText: (_, record) => record.update_time || '-',
                    },
                  ]}
                />
              </div>
            ) : (
              <Empty
                description={intl.formatMessage({
                  id: 'pages.cluster.workloads.detail.empty',
                  defaultMessage: '未找到工作负载',
                })}
              />
            )}
          </Spin>
        </div>
      </div>
      <div className={styles.section}>
        <SectionTitle>容器组</SectionTitle>
        <ContainerReplicas workload={workload} />
      </div>
      <div className={styles.section}>
        <SectionTitle>事件</SectionTitle>
        <EventTable name={name} namespace={namespace} type={type} />
      </div>
    </PageContainer>
  );
};

export default WorkloadDetail;
