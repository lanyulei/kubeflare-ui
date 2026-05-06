import {
  AliyunOutlined,
  AmazonOutlined,
  AntCloudOutlined,
  CloudServerOutlined,
  ClusterOutlined,
  DeleteOutlined,
  DeploymentUnitOutlined,
  EditOutlined,
  EyeOutlined,
  GlobalOutlined,
  GoogleOutlined,
  PlusOutlined,
  SearchOutlined,
  WindowsOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  PageContainer,
  ProForm,
  ProDescriptions,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  App,
  Button,
  Col,
  Drawer,
  Input,
  Popconfirm,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import React, { useRef, useState } from 'react';
import { YamlEditor } from '@/components';
import {
  createCluster,
  deleteCluster,
  getClusterDetail,
  getClusterList,
  updateCluster,
} from '@/services/kubeflare/cluster/info';

type ClusterFormValues = API.CreateClusterParams & API.UpdateClusterParams;

const CLUSTER_PROVIDER_OPTIONS: {
  icon: React.ReactNode;
  labelId: string;
  label: string;
  value: API.ClusterProvider;
}[] = [
  {
    icon: <ClusterOutlined />,
    labelId: 'pages.cluster.provider.kubernetes',
    label: 'Kubernetes',
    value: 'kubernetes',
  },
  {
    icon: <AliyunOutlined />,
    labelId: 'pages.cluster.provider.aliyun',
    label: '阿里云',
    value: 'aliyun',
  },
  {
    icon: <CloudServerOutlined />,
    labelId: 'pages.cluster.provider.tencent',
    label: '腾讯云',
    value: 'tencent',
  },
  {
    icon: <AntCloudOutlined />,
    labelId: 'pages.cluster.provider.huawei',
    label: '华为云',
    value: 'huawei',
  },
  {
    icon: <AmazonOutlined />,
    labelId: 'pages.cluster.provider.aws',
    label: 'AWS',
    value: 'aws',
  },
  {
    icon: <WindowsOutlined />,
    labelId: 'pages.cluster.provider.azure',
    label: 'Azure',
    value: 'azure',
  },
  {
    icon: <GoogleOutlined />,
    labelId: 'pages.cluster.provider.google',
    label: 'Google Cloud',
    value: 'google',
  },
  {
    icon: <DeploymentUnitOutlined />,
    labelId: 'pages.cluster.provider.selfHosted',
    label: '自建',
    value: 'self_hosted',
  },
  {
    icon: <GlobalOutlined />,
    labelId: 'pages.cluster.provider.other',
    label: '其他',
    value: 'other',
  },
];

const useStyles = createStyles(({ token }) => ({
  yamlPreview: {
    marginTop: token.marginXS,
  },
}));

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const matchClusterKeyword = (record: API.ClusterItem, keyword: string) => {
  if (!keyword) {
    return true;
  }
  const normalizedKeyword = keyword.toLowerCase();
  return [record.name, record.alias]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedKeyword));
};

const getErrorMessage = (error: unknown) => {
  const apiError = error as {
    info?: { message?: string };
    message?: string;
    response?: { data?: { message?: string } };
  };
  return (
    apiError.info?.message ||
    apiError.response?.data?.message ||
    apiError.message ||
    '保存失败'
  );
};

const buildClusterPayload = (
  values: ClusterFormValues,
): API.CreateClusterParams => ({
  name: values.name.trim(),
  alias: normalizeOptionalText(values.alias),
  provider: values.provider,
  yaml: values.yaml.trim(),
  remarks: normalizeOptionalText(values.remarks),
  status: Number(values.status ?? 1),
  test_connection: Boolean(values.test_connection),
});

const getProviderOptions = (intl: ReturnType<typeof useIntl>) =>
  CLUSTER_PROVIDER_OPTIONS.map((item) => ({
    label: renderProviderLabel(intl, item.value),
    value: item.value,
  }));

const getProviderText = (
  intl: ReturnType<typeof useIntl>,
  provider?: string,
) => {
  const option = CLUSTER_PROVIDER_OPTIONS.find(
    (item) => item.value === provider,
  );
  if (!option) {
    return provider || '-';
  }
  return intl.formatMessage({
    id: option.labelId,
    defaultMessage: option.label,
  });
};

const renderProviderLabel = (
  intl: ReturnType<typeof useIntl>,
  provider?: string,
) => {
  const option = CLUSTER_PROVIDER_OPTIONS.find(
    (item) => item.value === provider,
  );
  if (!option) {
    return getProviderText(intl, provider);
  }
  return (
    <Space size={6}>
      {option.icon}
      <span>{getProviderText(intl, provider)}</span>
    </Space>
  );
};

const getRunningStateTag = (state?: string) => {
  if (state === 'available') {
    return <Tag color="success">可用</Tag>;
  }
  if (state === 'unhealthy') {
    return <Tag color="error">异常</Tag>;
  }
  if (state === 'disabled') {
    return <Tag color="default">停用</Tag>;
  }
  return <Tag color="warning">未知</Tag>;
};

const renderClusterFormFields = (intl: ReturnType<typeof useIntl>) => (
  <>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormText
          name="name"
          label={intl.formatMessage({
            id: 'pages.cluster.name',
            defaultMessage: '集群名称',
          })}
          rules={[
            { required: true, message: '请输入集群名称' },
            { min: 2, max: 128, message: '集群名称长度需在 2 到 128 位之间' },
          ]}
        />
      </Col>
      <Col xs={24} md={12}>
        <ProFormText
          name="alias"
          label={intl.formatMessage({
            id: 'pages.cluster.alias',
            defaultMessage: '集群别名',
          })}
          rules={[{ max: 128, message: '集群别名长度不能超过 128 位' }]}
        />
      </Col>
    </Row>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormSelect
          name="provider"
          label={intl.formatMessage({
            id: 'pages.cluster.provider',
            defaultMessage: '供应商',
          })}
          options={getProviderOptions(intl)}
          placeholder={intl.formatMessage({
            id: 'pages.cluster.provider.placeholder',
            defaultMessage: '请选择供应商',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pages.cluster.provider.required',
                defaultMessage: '请选择供应商',
              }),
            },
          ]}
        />
      </Col>
      <Col xs={24} md={12}>
        <ProFormRadio.Group
          name="status"
          label={intl.formatMessage({
            id: 'pages.cluster.status',
            defaultMessage: '状态',
          })}
          options={[
            {
              label: intl.formatMessage({
                id: 'pages.cluster.status.enabled',
                defaultMessage: '启用',
              }),
              value: 1,
            },
            {
              label: intl.formatMessage({
                id: 'pages.cluster.status.disabled',
                defaultMessage: '禁用',
              }),
              value: 0,
            },
          ]}
          initialValue={1}
        />
      </Col>
    </Row>
    <ProForm.Item
      name="yaml"
      label={intl.formatMessage({
        id: 'pages.cluster.yaml',
        defaultMessage: '配置 YAML',
      })}
      rules={[{ required: true, message: '请输入配置 YAML' }]}
    >
      <YamlEditor
        placeholder={'apiVersion: v1\nkind: Config\nmetadata:\n  name: cluster'}
      />
    </ProForm.Item>
    <ProFormSwitch
      name="test_connection"
      label={intl.formatMessage({
        id: 'pages.cluster.testConnection',
        defaultMessage: '保存前连接测试',
      })}
      initialValue={false}
      fieldProps={{
        checkedChildren: intl.formatMessage({
          id: 'pages.cluster.testConnection.enabled',
          defaultMessage: '开启',
        }),
        unCheckedChildren: intl.formatMessage({
          id: 'pages.cluster.testConnection.disabled',
          defaultMessage: '关闭',
        }),
      }}
    />
    <ProFormTextArea
      name="remarks"
      label={intl.formatMessage({
        id: 'pages.cluster.remarks',
        defaultMessage: '备注',
      })}
      fieldProps={{
        rows: 3,
        maxLength: 512,
        showCount: true,
      }}
    />
  </>
);

const ClusterManagementPage: React.FC = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const clusterKeywordRef = useRef('');
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingCluster, setEditingCluster] = useState<
    API.ClusterItem | undefined
  >(undefined);
  const [detailCluster, setDetailCluster] = useState<
    API.ClusterItem | undefined
  >(undefined);

  const openDetail = async (record: API.ClusterItem) => {
    const res = await getClusterDetail(record.id);
    setDetailCluster(res.data);
    setDetailVisible(true);
  };

  const openEdit = async (record: API.ClusterItem) => {
    const res = await getClusterDetail(record.id);
    setEditingCluster(res.data);
    setEditVisible(true);
  };

  const columns: ProColumns<API.ClusterItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.cluster.name',
        defaultMessage: '集群名称',
      }),
      dataIndex: 'name',
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.alias',
        defaultMessage: '集群别名',
      }),
      dataIndex: 'alias',
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.provider',
        defaultMessage: '供应商',
      }),
      dataIndex: 'provider',
      ellipsis: true,
      filters: getProviderOptions(intl).map((item) => ({
        text: item.label,
        value: item.value,
      })),
      onFilter: (value, record) => record.provider === value,
      render: (_, record) => renderProviderLabel(intl, record.provider),
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      width: 100,
      render: (_, record) =>
        record.status === 1 ? (
          <Tag color="success">
            {intl.formatMessage({
              id: 'pages.cluster.status.enabled',
              defaultMessage: '启用',
            })}
          </Tag>
        ) : (
          <Tag color="default">
            {intl.formatMessage({
              id: 'pages.cluster.status.disabled',
              defaultMessage: '禁用',
            })}
          </Tag>
        ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodeCount',
        defaultMessage: '节点数',
      }),
      dataIndex: 'node_count',
      width: 100,
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.runningState',
        defaultMessage: '运行状态',
      }),
      dataIndex: 'running_state',
      width: 120,
      render: (_, record) => getRunningStateTag(record.running_state),
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.version',
        defaultMessage: '集群版本',
      }),
      dataIndex: 'version',
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.updatedAt',
        defaultMessage: '更新时间',
      }),
      dataIndex: 'update_time',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.option',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      key: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => [
        <a key="detail" onClick={() => openDetail(record)}>
          <EyeOutlined />{' '}
          {intl.formatMessage({
            id: 'pages.cluster.detail',
            defaultMessage: '详情',
          })}
        </a>,
        <a key="edit" onClick={() => openEdit(record)}>
          <EditOutlined />{' '}
          {intl.formatMessage({
            id: 'pages.cluster.edit',
            defaultMessage: '编辑',
          })}
        </a>,
        <Popconfirm
          key="delete"
          title={intl.formatMessage({
            id: 'pages.cluster.delete.confirm',
            defaultMessage: '确认删除该集群吗？',
          })}
          onConfirm={async () => {
            await deleteCluster(record.id);
            message.success(
              intl.formatMessage({
                id: 'pages.cluster.delete.success',
                defaultMessage: '集群已删除',
              }),
            );
            actionRef.current?.reload();
          }}
        >
          <a>
            <DeleteOutlined />{' '}
            {intl.formatMessage({
              id: 'pages.cluster.delete',
              defaultMessage: '删除',
            })}
          </a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'pages.cluster.title',
        defaultMessage: '集群管理',
      })}
    >
      <ProTable<API.ClusterItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        scroll={{ x: 1200 }}
        request={async () => {
          const res = await getClusterList({
            keyword: normalizeOptionalText(clusterKeywordRef.current),
          });
          const items = res.data.items || [];
          return {
            data: items.filter((item) =>
              matchClusterKeyword(item, clusterKeywordRef.current),
            ),
            success: true,
          };
        }}
        headerTitle={
          <div>
            <Button
              style={{marginRight: '10px'}}
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateVisible(true)}
            >
              {intl.formatMessage({
                id: 'pages.cluster.create',
                defaultMessage: '新建集群',
              })}
            </Button>
            <Input
              allowClear
              suffix={<SearchOutlined />}
              style={{ width: 260 }}
              placeholder={intl.formatMessage({
                id: 'pages.cluster.search.placeholder',
                defaultMessage: '搜索集群名称 / 别名',
              })}
              onChange={(event) => {
                clusterKeywordRef.current = event.target.value.trim();
                actionRef.current?.reload();
              }}
            />
          </div>
        }
        toolBarRender={() => [

        ]}
      />

      <DrawerForm<ClusterFormValues>
        title={intl.formatMessage({
          id: 'pages.cluster.create',
          defaultMessage: '新建集群',
        })}
        open={createVisible}
        width={760}
        drawerProps={{
          destroyOnHidden: true,
          onClose: () => setCreateVisible(false),
        }}
        initialValues={{ status: 1, test_connection: false }}
        onFinish={async (values) => {
          try {
            await createCluster(buildClusterPayload(values), {
              skipErrorHandler: true,
            });
            message.success(
              intl.formatMessage({
                id: 'pages.cluster.create.success',
                defaultMessage: '集群创建成功',
              }),
            );
            setCreateVisible(false);
            actionRef.current?.reload();
            return true;
          } catch (error) {
            message.error(getErrorMessage(error));
            return false;
          }
        }}
      >
        {renderClusterFormFields(intl)}
      </DrawerForm>

      <DrawerForm<ClusterFormValues>
        title={intl.formatMessage({
          id: 'pages.cluster.edit',
          defaultMessage: '编辑集群',
        })}
        open={editVisible}
        width={760}
        initialValues={{
          ...editingCluster,
          test_connection: Boolean(editingCluster?.test_connection),
        }}
        drawerProps={{
          destroyOnHidden: true,
          onClose: () => {
            setEditVisible(false);
            setEditingCluster(undefined);
          },
        }}
        onFinish={async (values) => {
          if (!editingCluster) {
            return false;
          }
          try {
            await updateCluster(
              editingCluster.id,
              buildClusterPayload(values),
              {
                skipErrorHandler: true,
              },
            );
            message.success(
              intl.formatMessage({
                id: 'pages.cluster.edit.success',
                defaultMessage: '集群更新成功',
              }),
            );
            setEditVisible(false);
            setEditingCluster(undefined);
            actionRef.current?.reload();
            return true;
          } catch (error) {
            message.error(getErrorMessage(error));
            return false;
          }
        }}
      >
        {renderClusterFormFields(intl)}
      </DrawerForm>

      <Drawer
        title={intl.formatMessage({
          id: 'pages.cluster.detail',
          defaultMessage: '集群详情',
        })}
        open={detailVisible}
        width={860}
        footer={null}
        destroyOnHidden
        onClose={() => {
          setDetailVisible(false);
          setDetailCluster(undefined);
        }}
      >
        <ProDescriptions<API.ClusterItem>
          column={2}
          dataSource={detailCluster}
          columns={[
            { title: '集群名称', dataIndex: 'name' },
            { title: '集群别名', dataIndex: 'alias' },
            {
              title: '供应商',
              dataIndex: 'provider',
              render: (_, record) =>
                renderProviderLabel(intl, record?.provider),
            },
            {
              title: '状态',
              dataIndex: 'status',
              render: (_, record) =>
                record?.status === 1 ? (
                  <Tag color="success">启用</Tag>
                ) : (
                  <Tag color="default">禁用</Tag>
                ),
            },
            { title: '节点数', dataIndex: 'node_count' },
            {
              title: '保存前连接测试',
              dataIndex: 'test_connection',
              render: (_, record) =>
                record?.test_connection ? (
                  <Tag color="processing">开启</Tag>
                ) : (
                  <Tag color="default">关闭</Tag>
                ),
            },
            {
              title: '运行状态',
              dataIndex: 'running_state',
              render: (_, record) => getRunningStateTag(record?.running_state),
            },
            { title: '集群版本', dataIndex: 'version' },
            {
              title: '更新时间',
              dataIndex: 'update_time',
              valueType: 'dateTime',
            },
            { title: '备注', dataIndex: 'remarks', span: 2 },
            { title: '状态信息', dataIndex: 'message', span: 2 },
          ]}
        />
        <Typography.Text strong copyable={{ text: detailCluster?.yaml || '' }}>
          配置 YAML
        </Typography.Text>
        <div className={styles.yamlPreview}>
          <YamlEditor
            value={detailCluster?.yaml || ''}
            readOnly
            minHeight={320}
            maxHeight={420}
          />
        </div>
      </Drawer>
    </PageContainer>
  );
};

export default ClusterManagementPage;
