import {
  DeleteOutlined,
  DownOutlined,
  FileTextOutlined,
  ReloadOutlined,
  RollbackOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { history, useIntl, useParams } from '@umijs/max';
import {
  App,
  Button,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
} from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useState } from 'react';
import { parse, stringify } from 'yaml';
import { SectionTitle, YamlEditor } from '@/components';
import {
  deleteClusterWorkload,
  getClusterWorkloadDetail,
  getClusterWorkloadManifest,
  getClusterWorkloadRevisionList,
  recreateClusterWorkload,
  rollbackClusterWorkload,
  updateClusterWorkloadManifest,
  updateClusterWorkloadReplicas,
} from '@/services/kubeflare/cluster/workload';
import ContainerReplicas from './components/ContainerReplicas';
import ContainerStatusManagement from './components/ContainerStatusManagement';
import EventTable from './components/EventTable';
import ReplicaSummary from './components/ReplicaSummary';
import useWorkloadPods from './components/useWorkloadPods';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';

type WorkloadActionKey =
  | 'rollback'
  | 'settings'
  | 'yaml'
  | 'recreate'
  | 'delete';

type WorkloadSettingsFormValues = {
  replicas?: number;
};

type WorkloadRollbackFormValues = {
  target_revision?: number;
};

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
  const { message, modal } = App.useApp();
  const intl = useIntl();
  const { styles } = useStyles();
  const [settingsForm] = Form.useForm<WorkloadSettingsFormValues>();
  const [rollbackForm] = Form.useForm<WorkloadRollbackFormValues>();
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
  const [actionLoading, setActionLoading] = useState<WorkloadActionKey>();
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [revisions, setRevisions] = useState<API.ClusterWorkloadRevisionItem[]>(
    [],
  );
  const [yamlModalOpen, setYamlModalOpen] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const [workload, setWorkload] = useState<API.ClusterWorkloadItem>();
  const {
    loading: podLoading,
    pods,
    reload: reloadPods,
  } = useWorkloadPods(workload);
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
  const detailParams =
    type && namespace && name
      ? {
          type,
          namespace,
          name,
        }
      : undefined;
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    error: styles.statusDotError,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };
  const workloadActionItems = [
    {
      key: 'rollback',
      icon: <RollbackOutlined />,
      label: '回退',
    },
    {
      key: 'settings',
      disabled: type === 'DaemonSet',
      icon: <SettingOutlined />,
      label: '编辑设置',
    },
    {
      key: 'yaml',
      icon: <FileTextOutlined />,
      label: '编辑 YAML',
    },
    {
      key: 'recreate',
      icon: <ReloadOutlined />,
      label: '重新创建',
    },
    {
      danger: true,
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
    },
  ];
  const currentRevision = Number(
    descriptionData?.annotations?.['deployment.kubernetes.io/revision'],
  );
  const currentRevisionLabel = Number.isFinite(currentRevision)
    ? `#${currentRevision}`
    : '-';

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

  const refreshDetail = async () => {
    await fetchWorkload();
    await reloadPods();
  };

  const openSettingsModal = () => {
    settingsForm.setFieldsValue({
      replicas: descriptionData?.replicas || 0,
    });
    setSettingsModalOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!detailParams) {
      return;
    }

    const values = await settingsForm.validateFields();
    const replicas = values.replicas ?? 0;

    setActionLoading('settings');
    try {
      const res = await updateClusterWorkloadReplicas({
        ...detailParams,
        replicas,
      });
      message.success('工作负载设置已更新');
      setWorkload(res.data);
      setSettingsModalOpen(false);
      await refreshDetail();
    } finally {
      setActionLoading(undefined);
    }
  };

  const openRollbackModal = async () => {
    if (!detailParams) {
      return;
    }

    rollbackForm.resetFields();
    setRollbackModalOpen(true);
    setRevisionLoading(true);
    try {
      const res = await getClusterWorkloadRevisionList(detailParams);
      setRevisions(res.data.items || []);
    } finally {
      setRevisionLoading(false);
    }
  };

  const handleSaveRollback = async () => {
    if (!detailParams) {
      return;
    }

    const values = await rollbackForm.validateFields();

    if (!values.target_revision) {
      message.warning('请选择目标修改记录');
      return;
    }

    setActionLoading('rollback');
    try {
      const res = await rollbackClusterWorkload({
        ...detailParams,
        target_revision: values.target_revision,
      });
      message.success('工作负载已回退');
      setWorkload(res.data);
      setRollbackModalOpen(false);
      await refreshDetail();
    } finally {
      setActionLoading(undefined);
    }
  };

  const openYamlModal = async () => {
    if (!detailParams) {
      return;
    }

    setYamlModalOpen(true);
    setActionLoading('yaml');
    try {
      const res = await getClusterWorkloadManifest(detailParams);
      setYamlValue(stringify(res.data || {}, { indent: 2 }));
    } finally {
      setActionLoading(undefined);
    }
  };

  const handleSaveYaml = async () => {
    if (!detailParams) {
      return;
    }

    let manifest: unknown;

    try {
      manifest = parse(yamlValue);
    } catch {
      message.error('YAML 格式不正确，请检查后重试');
      return;
    }

    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
      message.error('YAML 内容必须是有效的资源对象');
      return;
    }

    setActionLoading('yaml');
    try {
      const res = await updateClusterWorkloadManifest({
        ...detailParams,
        manifest: manifest as Record<string, unknown>,
      });
      message.success('工作负载 YAML 已更新');
      setWorkload(res.data);
      setYamlModalOpen(false);
      await refreshDetail();
    } finally {
      setActionLoading(undefined);
    }
  };

  const handleRollback = () => {
    void openRollbackModal();
  };

  const handleRecreate = () => {
    if (!detailParams) {
      return;
    }

    modal.confirm({
      title: '确认重新创建该工作负载吗？',
      content: '重新创建将会根据更新策略触发容器组重建，业务可能出现短暂波动。',
      okText: '重新创建',
      cancelText: '取消',
      onOk: async () => {
        setActionLoading('recreate');
        try {
          const res = await recreateClusterWorkload(detailParams);
          message.success('工作负载已开始重新创建');
          setWorkload(res.data);
          await refreshDetail();
        } finally {
          setActionLoading(undefined);
        }
      },
    });
  };

  const handleDelete = () => {
    if (!detailParams) {
      return;
    }

    modal.confirm({
      title: '确认删除该工作负载吗？',
      content: '删除后工作负载及其管理的容器组将被移除，请谨慎操作。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: {
        danger: true,
      },
      onOk: async () => {
        setActionLoading('delete');
        try {
          await deleteClusterWorkload(detailParams);
          message.success('工作负载已删除');
          history.push('/cluster/workloads/list');
        } finally {
          setActionLoading(undefined);
        }
      },
    });
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
      extra={[
        <Dropdown
          disabled={!detailParams}
          key="workload-actions"
          menu={{
            items: workloadActionItems,
            onClick: ({ key }) => {
              if (key === 'rollback') {
                handleRollback();
              }
              if (key === 'settings') {
                openSettingsModal();
              }
              if (key === 'yaml') {
                openYamlModal();
              }
              if (key === 'recreate') {
                handleRecreate();
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
        <SectionTitle>容器状态管理</SectionTitle>
        <ContainerStatusManagement loading={podLoading} pods={pods} />
      </div>
      <div className={styles.section}>
        <SectionTitle>容器组</SectionTitle>
        <ContainerReplicas
          loading={podLoading}
          onReload={reloadPods}
          pods={pods}
          workload={workload}
        />
      </div>
      <div className={styles.section}>
        <SectionTitle>事件</SectionTitle>
        <EventTable name={name} namespace={namespace} type={type} />
      </div>
      <Modal
        title={
          <>
            <RollbackOutlined /> 回退
          </>
        }
        open={rollbackModalOpen}
        confirmLoading={actionLoading === 'rollback'}
        okText="确定"
        cancelText="取消"
        onCancel={() => setRollbackModalOpen(false)}
        onOk={handleSaveRollback}
      >
        <Spin spinning={revisionLoading}>
          <Form form={rollbackForm} layout="vertical">
            <Form.Item label="资源名称">
              <Input disabled value={descriptionData?.name || name || '-'} />
            </Form.Item>
            <Form.Item label="当前修改记录">
              <Input disabled value={currentRevisionLabel} />
            </Form.Item>
            <Form.Item
              label="目标修改记录"
              name="target_revision"
              rules={[{ required: true, message: '请选择目标修改记录' }]}
            >
              <Select<number>
                loading={revisionLoading}
                optionFilterProp="label"
                placeholder="请选择目标修改记录"
                showSearch
                options={revisions
                  .filter((item) => item.revision !== currentRevision)
                  .map((item) => ({
                    label: `#${item.revision}`,
                    value: item.revision,
                  }))}
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
      <Modal
        title="编辑设置"
        open={settingsModalOpen}
        confirmLoading={actionLoading === 'settings'}
        okText="保存"
        cancelText="取消"
        onCancel={() => setSettingsModalOpen(false)}
        onOk={handleSaveSettings}
      >
        <Form form={settingsForm} layout="vertical">
          <Form.Item
            label="副本数"
            name="replicas"
            rules={[{ required: true, message: '请输入副本数' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
      <Drawer
        title={
          <>
            <FileTextOutlined /> 编辑当前资源 YAML
          </>
        }
        open={yamlModalOpen}
        width="65vw"
        destroyOnHidden
        footer={
          <div className={styles.yamlDrawerFooter}>
            <Button onClick={() => setYamlModalOpen(false)}>取消</Button>
            <Button
              loading={actionLoading === 'yaml'}
              type="primary"
              onClick={handleSaveYaml}
            >
              确定
            </Button>
          </div>
        }
        onClose={() => setYamlModalOpen(false)}
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
    </PageContainer>
  );
};

export default WorkloadDetail;
