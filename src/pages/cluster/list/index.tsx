import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { useIntl } from '@umijs/max'
import { App, Button, Col, Popconfirm, Row, Tag } from 'antd'
import React, { useRef, useState } from 'react'
import {
  createCluster,
  deleteCluster,
  getClusterDetail,
  getClusterList,
  updateCluster,
} from '@/services/kubeflare/clusters'

type ClusterFormValues = API.CreateClusterParams &
  API.UpdateClusterParams

const nameRules = [
  { required: true, message: '请输入集群名称' },
  { min: 2, max: 128, message: '集群名称长度需在 2 到 128 位之间' },
]

const aliasRules = [{ max: 128, message: '集群别名最长 128 个字符' }]

const providerRules = [
  { required: true, message: '请输入供应商' },
  { min: 2, max: 64, message: '供应商长度需在 2 到 64 位之间' },
]

const yamlRules = [
  { required: true, message: '请输入 Kubeconfig' },
  { max: 1048576, message: 'Kubeconfig 内容过长' },
]

const remarksRules = [{ max: 512, message: '备注最长 512 个字符' }]

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim()
  return nextValue || undefined
}

const buildClusterPayload = (values: ClusterFormValues) => ({
  name: values.name.trim(),
  alias: normalizeOptionalText(values.alias),
  provider: values.provider.trim(),
  yaml: values.yaml.trim(),
  remarks: normalizeOptionalText(values.remarks),
  status: values.status ?? true,
})

const runtimeStatusMap: Record<string, { color: string; labelId: string }> = {
  available: { color: 'success', labelId: 'pages.cluster.list.runtimeStatus.available' },
  unavailable: { color: 'error', labelId: 'pages.cluster.list.runtimeStatus.unavailable' },
  disabled: { color: 'default', labelId: 'pages.cluster.list.runtimeStatus.disabled' },
  unknown: { color: 'warning', labelId: 'pages.cluster.list.runtimeStatus.unknown' },
}

const renderClusterFormFields = (
  intl: ReturnType<typeof useIntl>,
  isEdit = false,
) => (
  <>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormText
          name="name"
          label={intl.formatMessage({
            id: 'pages.cluster.list.name',
            defaultMessage: '集群名称',
          })}
          rules={nameRules}
        />
      </Col>
      <Col xs={24} md={12}>
        <ProFormText
          name="alias"
          label={intl.formatMessage({
            id: 'pages.cluster.list.alias',
            defaultMessage: '集群别名',
          })}
          rules={aliasRules}
        />
      </Col>
    </Row>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormSelect
          name="provider"
          label={intl.formatMessage({
            id: 'pages.cluster.list.provider',
            defaultMessage: '供应商',
          })}
          rules={providerRules}
          options={[
            { label: 'Aliyun', value: 'aliyun' },
            { label: 'Tencent Cloud', value: 'tencent' },
            { label: 'AWS', value: 'aws' },
            { label: 'Azure', value: 'azure' },
            { label: 'Google Cloud', value: 'gcp' },
            { label: 'Huawei Cloud', value: 'huawei' },
            { label: 'Other', value: 'other' },
          ]}
        />
      </Col>
      <Col xs={24} md={12}>
        <ProFormRadio.Group
          name="status"
          label={intl.formatMessage({
            id: 'pages.cluster.list.status',
            defaultMessage: '状态',
          })}
          options={[
            {
              label: intl.formatMessage({
                id: 'pages.cluster.list.status.enabled',
                defaultMessage: '启用',
              }),
              value: true,
            },
            {
              label: intl.formatMessage({
                id: 'pages.cluster.list.status.disabled',
                defaultMessage: '禁用',
              }),
              value: false,
            },
          ]}
          initialValue
        />
      </Col>
    </Row>
    <ProFormTextArea
      name="yaml"
      label={intl.formatMessage({
        id: 'pages.cluster.list.yaml',
        defaultMessage: 'Kubeconfig',
      })}
      rules={yamlRules}
      fieldProps={{
        rows: 8,
        placeholder: intl.formatMessage({
          id: 'pages.cluster.list.yaml.placeholder',
          defaultMessage: '请粘贴 Kubeconfig 内容',
        }),
      }}
    />
    <ProFormTextArea
      name="remarks"
      label={intl.formatMessage({
        id: 'pages.cluster.list.remarks',
        defaultMessage: '备注',
      })}
      rules={remarksRules}
      fieldProps={{
        rows: 3,
        maxLength: 512,
        showCount: true,
      }}
    />
  </>
)

const ClusterListPage: React.FC = () => {
  const intl = useIntl()
  const { message } = App.useApp()
  const actionRef = useRef<ActionType | null>(null)
  const [editingCluster, setEditingCluster] = useState<
    API.ClusterItem | undefined
  >(undefined)
  const [createVisible, setCreateVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)

  const columns: ProColumns<API.ClusterItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.cluster.list.name',
        defaultMessage: '集群名称',
      }),
      dataIndex: 'name',
      width: 240,
      render: (_, record) => (
        <div>
          <div>{record.name}</div>
          {record.remarks && (
            <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>
              {record.remarks}
            </div>
          )}
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.list.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      width: 100,
      render: (_, record) =>
        record.status ? (
          <Tag color="success">
            {intl.formatMessage({
              id: 'pages.cluster.list.status.enabled',
              defaultMessage: '启用',
            })}
          </Tag>
        ) : (
          <Tag color="default">
            {intl.formatMessage({
              id: 'pages.cluster.list.status.disabled',
              defaultMessage: '禁用',
            })}
          </Tag>
        ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.list.runtimeStatus',
        defaultMessage: '运行状态',
      }),
      dataIndex: 'runtime_status',
      width: 110,
      render: (_, record) => {
        const statusInfo = runtimeStatusMap[record.runtime_status]
        if (!statusInfo) {
          return <Tag>{record.runtime_status}</Tag>
        }
        return (
          <Tag color={statusInfo.color}>
            {intl.formatMessage({
              id: statusInfo.labelId,
              defaultMessage: record.runtime_status,
            })}
          </Tag>
        )
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.list.clusterVersion',
        defaultMessage: '集群版本',
      }),
      dataIndex: 'cluster_version',
      width: 140,
      render: (_, record) => record.cluster_version || '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.list.nodeCount',
        defaultMessage: '节点数量',
      }),
      dataIndex: 'node_count',
      width: 100,
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.list.createTime',
        defaultMessage: '创建时间',
      }),
      dataIndex: 'create_time',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.list.updateTime',
        defaultMessage: '更新时间',
      }),
      dataIndex: 'update_time',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.list.option',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      key: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => [
        <a
          key="edit"
          onClick={async () => {
            const res = await getClusterDetail(record.id)
            setEditingCluster(res.data)
            setEditVisible(true)
          }}
        >
          <EditOutlined />{' '}
          {intl.formatMessage({
            id: 'pages.cluster.list.edit',
            defaultMessage: '编辑',
          })}
        </a>,
        <Popconfirm
          key="delete"
          title={intl.formatMessage({
            id: 'pages.cluster.list.delete.confirm',
            defaultMessage: '确认删除该集群吗？',
          })}
          onConfirm={async () => {
            await deleteCluster(record.id)
            message.success(
              intl.formatMessage({
                id: 'pages.cluster.list.delete.success',
                defaultMessage: '集群已删除',
              }),
            )
            actionRef.current?.reload()
          }}
        >
          <a>
            <DeleteOutlined />{' '}
            {intl.formatMessage({
              id: 'pages.cluster.list.delete',
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
        id: 'pages.cluster.list.title',
        defaultMessage: '集群列表',
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
              id: 'pages.cluster.list.create',
              defaultMessage: '新建集群',
            })}
          </Button>
        }
      />

      <ModalForm<ClusterFormValues>
        title={intl.formatMessage({
          id: 'pages.cluster.list.create',
          defaultMessage: '新建集群',
        })}
        open={createVisible}
        width={650}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setCreateVisible(false),
        }}
        initialValues={{ status: true }}
        onFinish={async (values) => {
          await createCluster(buildClusterPayload(values))
          message.success(
            intl.formatMessage({
              id: 'pages.cluster.list.create.success',
              defaultMessage: '集群创建成功',
            }),
          )
          setCreateVisible(false)
          actionRef.current?.reload()
          return true
        }}
      >
        {renderClusterFormFields(intl)}
      </ModalForm>

      <ModalForm<ClusterFormValues>
        title={intl.formatMessage({
          id: 'pages.cluster.list.edit',
          defaultMessage: '编辑集群',
        })}
        open={editVisible}
        width={650}
        initialValues={{
          name: editingCluster?.name,
          alias: editingCluster?.alias,
          provider: editingCluster?.provider,
          remarks: editingCluster?.remarks,
          status: editingCluster?.status ?? true,
        }}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => {
            setEditVisible(false)
            setEditingCluster(undefined)
          },
        }}
        onFinish={async (values) => {
          if (!editingCluster) {
            return false
          }
          const payload = buildClusterPayload(values)
          // preserve existing yaml if not changed
          if (editingCluster.yaml && !payload.yaml) {
            payload.yaml = editingCluster.yaml
          }
          await updateCluster(editingCluster.id, payload)
          message.success(
            intl.formatMessage({
              id: 'pages.cluster.list.edit.success',
              defaultMessage: '集群更新成功',
            }),
          )
          setEditVisible(false)
          setEditingCluster(undefined)
          actionRef.current?.reload()
          return true
        }}
      >
        {renderClusterFormFields(intl, true)}
      </ModalForm>
    </PageContainer>
  )
}

export default ClusterListPage
