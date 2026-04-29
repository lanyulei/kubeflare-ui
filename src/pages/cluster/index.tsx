import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  DrawerForm,
  PageContainer,
  ProForm,
  ProDescriptions,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { useIntl } from '@umijs/max'
import { App, Button, Col, Drawer, Popconfirm, Row, Tag, Typography } from 'antd'
import { createStyles } from 'antd-style'
import React, { useRef, useState } from 'react'
import { YamlEditor } from '@/components'
import {
  createCluster,
  deleteCluster,
  getClusterDetail,
  getClusterList,
  updateCluster,
} from '@/services/kubeflare/cluster/info'

type ClusterFormValues = API.CreateClusterParams & API.UpdateClusterParams

const useStyles = createStyles(({ token }) => ({
  yamlPreview: {
    marginTop: token.marginXS,
  },
}))

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim()
  return nextValue || undefined
}

const buildClusterPayload = (
  values: ClusterFormValues,
): API.CreateClusterParams => ({
  name: values.name.trim(),
  alias: normalizeOptionalText(values.alias),
  provider: values.provider.trim(),
  yaml: values.yaml.trim(),
  remarks: normalizeOptionalText(values.remarks),
  status: Number(values.status ?? 1),
})

const getRunningStateTag = (state?: string) => {
  if (state === 'available') {
    return <Tag color="success">可用</Tag>
  }
  if (state === 'unhealthy') {
    return <Tag color="error">异常</Tag>
  }
  if (state === 'disabled') {
    return <Tag color="default">停用</Tag>
  }
  return <Tag color="warning">未知</Tag>
}

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
          rules={[
            { max: 128, message: '集群别名长度不能超过 128 位' },
          ]}
        />
      </Col>
    </Row>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormText
          name="provider"
          label={intl.formatMessage({
            id: 'pages.cluster.provider',
            defaultMessage: '供应商',
          })}
          rules={[
            { required: true, message: '请输入供应商' },
            { min: 2, message: '供应商长度不能少于 2 位' },
            { max: 128, message: '供应商长度不能超过 128 位' },
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
)

const ClusterManagementPage: React.FC = () => {
  const intl = useIntl()
  const { styles } = useStyles()
  const { message } = App.useApp()
  const actionRef = useRef<ActionType | null>(null)
  const [createVisible, setCreateVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingCluster, setEditingCluster] = useState<
    API.ClusterItem | undefined
  >(undefined)
  const [detailCluster, setDetailCluster] = useState<
    API.ClusterItem | undefined
  >(undefined)

  const openDetail = async (record: API.ClusterItem) => {
    const res = await getClusterDetail(record.id)
    setDetailCluster(res.data)
    setDetailVisible(true)
  }

  const openEdit = async (record: API.ClusterItem) => {
    const res = await getClusterDetail(record.id)
    setEditingCluster(res.data)
    setEditVisible(true)
  }

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
      width: 220,
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
            await deleteCluster(record.id)
            message.success(
              intl.formatMessage({
                id: 'pages.cluster.delete.success',
                defaultMessage: '集群已删除',
              }),
            )
            actionRef.current?.reload()
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
  ]

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
          const res = await getClusterList()
          return {
            data: res.data.items || [],
            success: true,
          }
        }}
        headerTitle={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateVisible(true)}
          >
            {intl.formatMessage({
              id: 'pages.cluster.create',
              defaultMessage: '新建集群',
            })}
          </Button>
        }
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
        initialValues={{ status: 1 }}
        onFinish={async (values) => {
          await createCluster(buildClusterPayload(values))
          message.success(
            intl.formatMessage({
              id: 'pages.cluster.create.success',
              defaultMessage: '集群创建成功',
            }),
          )
          setCreateVisible(false)
          actionRef.current?.reload()
          return true
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
        initialValues={editingCluster}
        drawerProps={{
          destroyOnHidden: true,
          onClose: () => {
            setEditVisible(false)
            setEditingCluster(undefined)
          },
        }}
        onFinish={async (values) => {
          if (!editingCluster) {
            return false
          }
          await updateCluster(editingCluster.id, buildClusterPayload(values))
          message.success(
            intl.formatMessage({
              id: 'pages.cluster.edit.success',
              defaultMessage: '集群更新成功',
            }),
          )
          setEditVisible(false)
          setEditingCluster(undefined)
          actionRef.current?.reload()
          return true
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
          setDetailVisible(false)
          setDetailCluster(undefined)
        }}
      >
        <ProDescriptions<API.ClusterItem>
          column={2}
          dataSource={detailCluster}
          columns={[
            { title: '集群名称', dataIndex: 'name' },
            { title: '集群别名', dataIndex: 'alias' },
            { title: '供应商', dataIndex: 'provider' },
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
              title: '运行状态',
              dataIndex: 'running_state',
              render: (_, record) => getRunningStateTag(record?.running_state),
            },
            { title: '集群版本', dataIndex: 'version' },
            { title: '更新时间', dataIndex: 'update_time', valueType: 'dateTime' },
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
  )
}

export default ClusterManagementPage
