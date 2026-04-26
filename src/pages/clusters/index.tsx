import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ImportOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { useIntl } from '@umijs/max'
import { createStyles } from 'antd-style'
import {
  Alert,
  App,
  Button,
  Col,
  Descriptions,
  Drawer,
  Popconfirm,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd'
import React, { useMemo, useRef, useState } from 'react'
import {
  createCluster,
  deleteCluster,
  getClusterList,
  importKubeconfig,
  updateCluster,
} from '@/services/kubeflare/clusters'

const emptyText = '-'

const useStyles = createStyles(({ token }) => ({
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: token.marginSM,
  },
  muted: {
    color: token.colorTextTertiary,
  },
}))

type ClusterFormValues = Partial<API.CreateClusterParams> & {
  context_names_text?: string
  default_context?: string
  skip_unsupported?: boolean
}

const authTypeOptions = [
  { label: 'Bearer Token', value: 'bearer_token' },
  { label: 'Client Certificate', value: 'client_certificate' },
  { label: 'Basic Auth', value: 'basic' },
  { label: 'Auth Provider', value: 'auth_provider' },
  { label: 'Exec Plugin', value: 'exec' },
]

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim()
  return nextValue || undefined
}

const normalizeRequiredText = (value?: string) => value?.trim() || ''

const buildClusterPayload = (
  values: ClusterFormValues,
): API.CreateClusterParams => ({
  name: normalizeRequiredText(values.name),
  api_endpoint: normalizeRequiredText(values.api_endpoint),
  auth_type: values.auth_type || 'bearer_token',
  upstream_bearer_token: normalizeOptionalText(values.upstream_bearer_token),
  ca_cert_pem: normalizeOptionalText(values.ca_cert_pem),
  client_cert_pem: normalizeOptionalText(values.client_cert_pem),
  client_key_pem: normalizeOptionalText(values.client_key_pem),
  username: normalizeOptionalText(values.username),
  password: normalizeOptionalText(values.password),
  auth_provider_config: normalizeOptionalText(values.auth_provider_config),
  exec_config: normalizeOptionalText(values.exec_config),
  tls_server_name: normalizeOptionalText(values.tls_server_name),
  skip_tls_verify: Boolean(values.skip_tls_verify),
  proxy_url: normalizeOptionalText(values.proxy_url),
  disable_compression: Boolean(values.disable_compression),
  impersonate_user: normalizeOptionalText(values.impersonate_user),
  impersonate_uid: normalizeOptionalText(values.impersonate_uid),
  impersonate_groups: normalizeOptionalText(values.impersonate_groups),
  impersonate_extra: normalizeOptionalText(values.impersonate_extra),
  namespace: normalizeOptionalText(values.namespace),
  source_context: normalizeOptionalText(values.source_context),
  source_cluster: normalizeOptionalText(values.source_cluster),
  source_user: normalizeOptionalText(values.source_user),
  default: Boolean(values.default),
  enabled: values.enabled ?? true,
  kubeconfig: normalizeOptionalText(values.kubeconfig),
  kubeconfig_context: normalizeOptionalText(values.kubeconfig_context),
})

const buildImportPayload = (
  values: ClusterFormValues,
): API.ImportKubeconfigParams => ({
  kubeconfig: normalizeRequiredText(values.kubeconfig),
  context_names: values.context_names_text
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  default_context: normalizeOptionalText(values.default_context),
  enabled: values.enabled ?? true,
  skip_unsupported: Boolean(values.skip_unsupported),
})

const renderText = (value?: string | boolean) => {
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }

  return value || emptyText
}

const renderAuthFields = (
  intl: ReturnType<typeof useIntl>,
  isEdit: boolean,
) => (
  <ProFormDependency name={['auth_type']}>
    {({ auth_type }) => {
      const authType = auth_type || 'bearer_token'

      if (authType === 'client_certificate') {
        return (
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <ProFormTextArea
                name="client_cert_pem"
                label="Client Cert PEM"
                placeholder={isEdit ? '留空则保留原值' : undefined}
                fieldProps={{ rows: 4 }}
              />
            </Col>
            <Col xs={24} md={12}>
              <ProFormTextArea
                name="client_key_pem"
                label="Client Key PEM"
                placeholder={isEdit ? '留空则保留原值' : undefined}
                fieldProps={{ rows: 4 }}
              />
            </Col>
          </Row>
        )
      }

      if (authType === 'basic') {
        return (
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <ProFormText
                name="username"
                label={intl.formatMessage({
                  id: 'pages.clusters.username',
                  defaultMessage: '用户名',
                })}
                placeholder={isEdit ? '留空则保留原值' : undefined}
                rules={
                  isEdit
                    ? undefined
                    : [{ required: true, message: '请输入用户名' }]
                }
              />
            </Col>
            <Col xs={24} md={12}>
              <ProFormText.Password
                name="password"
                label={intl.formatMessage({
                  id: 'pages.clusters.password',
                  defaultMessage: '密码',
                })}
                placeholder={isEdit ? '留空则保留原值' : undefined}
                rules={
                  isEdit
                    ? undefined
                    : [{ required: true, message: '请输入密码' }]
                }
              />
            </Col>
          </Row>
        )
      }

      if (authType === 'auth_provider') {
        return (
          <ProFormTextArea
            name="auth_provider_config"
            label="Auth Provider Config"
            placeholder={isEdit ? '留空则保留原值' : '请输入 JSON 配置'}
            fieldProps={{ rows: 4 }}
          />
        )
      }

      if (authType === 'exec') {
        return (
          <ProFormTextArea
            name="exec_config"
            label="Exec Config"
            placeholder={isEdit ? '留空则保留原值' : '请输入 JSON 配置'}
            fieldProps={{ rows: 4 }}
          />
        )
      }

      return (
        <ProFormTextArea
          name="upstream_bearer_token"
          label="Bearer Token"
          placeholder={isEdit ? '留空则保留原值' : undefined}
          fieldProps={{ rows: 3 }}
        />
      )
    }}
  </ProFormDependency>
)

const renderClusterFormFields = (
  intl: ReturnType<typeof useIntl>,
  isEdit = false,
) => (
  <>
    <Alert
      showIcon
      type="info"
      message="可以直接填写连接信息，也可以粘贴 kubeconfig 后由后端解析上下文。"
      style={{ marginBottom: 16 }}
    />
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormText
          name="name"
          label={intl.formatMessage({
            id: 'pages.clusters.name',
            defaultMessage: '集群名称',
          })}
          rules={[
            {
              validator: async (_, value) => {
                if (!value) {
                  return
                }
                const name = String(value).trim()
                if (name.length < 2 || name.length > 128) {
                  throw new Error('集群名称长度需在 2 到 128 位之间')
                }
              },
            },
          ]}
        />
      </Col>
      <Col xs={24} md={12}>
        <ProFormText
          name="api_endpoint"
          label="API Endpoint"
          placeholder="https://kubernetes.example.com:6443"
          rules={[
            {
              validator: async (_, value) => {
                if (!value) {
                  return
                }
                const endpoint = String(value).trim()
                if (!endpoint.startsWith('https://')) {
                  throw new Error('API Endpoint 必须使用 https')
                }
              },
            },
          ]}
        />
      </Col>
    </Row>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormSelect
          name="auth_type"
          label="认证方式"
          options={authTypeOptions}
          initialValue="bearer_token"
        />
      </Col>
      <Col xs={24} md={12}>
        <ProFormText name="kubeconfig_context" label="Kubeconfig Context" />
      </Col>
    </Row>
    {renderAuthFields(intl, isEdit)}
    <ProFormTextArea
      name="kubeconfig"
      label="Kubeconfig"
      placeholder={isEdit ? '重新粘贴 kubeconfig 会覆盖连接与认证配置' : undefined}
      fieldProps={{ rows: 4 }}
    />
    <Typography.Paragraph strong>传输配置</Typography.Paragraph>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormText name="tls_server_name" label="TLS Server Name" />
      </Col>
      <Col xs={24} md={12}>
        <ProFormText name="proxy_url" label="Proxy URL" />
      </Col>
    </Row>
    <Row gutter={16}>
      <Col xs={24} md={8}>
        <ProFormSwitch name="skip_tls_verify" label="跳过 TLS 校验" />
      </Col>
      <Col xs={24} md={8}>
        <ProFormSwitch name="disable_compression" label="禁用压缩" />
      </Col>
      <Col xs={24} md={8}>
        <ProFormSwitch name="enabled" label="启用集群" initialValue />
      </Col>
    </Row>
    <Typography.Paragraph strong>代理身份与来源</Typography.Paragraph>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormText name="namespace" label="默认命名空间" />
      </Col>
      <Col xs={24} md={12}>
        <ProFormText name="impersonate_user" label="Impersonate User" />
      </Col>
    </Row>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormText name="impersonate_uid" label="Impersonate UID" />
      </Col>
      <Col xs={24} md={12}>
        <ProFormText name="impersonate_groups" label="Impersonate Groups" />
      </Col>
    </Row>
    <ProFormTextArea
      name="impersonate_extra"
      label="Impersonate Extra"
      fieldProps={{ rows: 3 }}
    />
    <Row gutter={16}>
      <Col xs={24} md={8}>
        <ProFormText name="source_context" label="Source Context" />
      </Col>
      <Col xs={24} md={8}>
        <ProFormText name="source_cluster" label="Source Cluster" />
      </Col>
      <Col xs={24} md={8}>
        <ProFormText name="source_user" label="Source User" />
      </Col>
    </Row>
    <ProFormSwitch name="default" label="设为默认集群" />
  </>
)

const ClusterManagementPage: React.FC = () => {
  const intl = useIntl()
  const { message } = App.useApp()
  const { styles } = useStyles()
  const actionRef = useRef<ActionType | null>(null)
  const [editingCluster, setEditingCluster] = useState<
    API.ClusterItem | undefined
  >(undefined)
  const [viewingCluster, setViewingCluster] = useState<
    API.ClusterItem | undefined
  >(undefined)
  const [createVisible, setCreateVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [importVisible, setImportVisible] = useState(false)

  const detailItems = useMemo(
    () =>
      viewingCluster
        ? [
            { label: 'ID', value: viewingCluster.id },
            { label: 'API Endpoint', value: viewingCluster.api_endpoint },
            { label: '认证方式', value: viewingCluster.auth_type },
            { label: '默认命名空间', value: viewingCluster.namespace },
            { label: 'TLS Server Name', value: viewingCluster.tls_server_name },
            { label: 'Proxy URL', value: viewingCluster.proxy_url },
            { label: '跳过 TLS 校验', value: viewingCluster.skip_tls_verify },
            {
              label: '禁用压缩',
              value: viewingCluster.disable_compression,
            },
            { label: 'Impersonate User', value: viewingCluster.impersonate_user },
            { label: 'Impersonate UID', value: viewingCluster.impersonate_uid },
            {
              label: 'Impersonate Groups',
              value: viewingCluster.impersonate_groups,
            },
            {
              label: 'Impersonate Extra',
              value: viewingCluster.impersonate_extra,
            },
            { label: 'Source Context', value: viewingCluster.source_context },
            { label: 'Source Cluster', value: viewingCluster.source_cluster },
            { label: 'Source User', value: viewingCluster.source_user },
          ]
        : [],
    [viewingCluster],
  )

  const columns: ProColumns<API.ClusterItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.clusters.name',
        defaultMessage: '集群名称',
      }),
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
      render: (_, record) => (
        <Space size={6}>
          <Typography.Text strong>{record.name}</Typography.Text>
          {record.default && <Tag color="blue">默认</Tag>}
        </Space>
      ),
    },
    {
      title: 'API Endpoint',
      dataIndex: 'api_endpoint',
      copyable: true,
      ellipsis: true,
    },
    {
      title: '认证方式',
      dataIndex: 'auth_type',
      width: 160,
      valueEnum: authTypeOptions.reduce<Record<string, { text: string }>>(
        (result, item) => {
          result[item.value] = { text: item.label }
          return result
        },
        {},
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.clusters.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'enabled',
      width: 120,
      render: (_, record) =>
        record.enabled ? (
          <Tag color="success">启用</Tag>
        ) : (
          <Tag color="default">禁用</Tag>
        ),
    },
    {
      title: '默认命名空间',
      dataIndex: 'namespace',
      ellipsis: true,
      renderText: (_, record) => record.namespace || emptyText,
    },
    {
      title: intl.formatMessage({
        id: 'pages.clusters.updatedAt',
        defaultMessage: '更新时间',
      }),
      dataIndex: 'updated_at',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: intl.formatMessage({
        id: 'pages.clusters.option',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      key: 'option',
      width: 230,
      render: (_, record) => [
        <a key="view" onClick={() => setViewingCluster(record)}>
          <EyeOutlined /> 查看
        </a>,
        <a
          key="edit"
          onClick={() => {
            setEditingCluster(record)
            setEditVisible(true)
          }}
        >
          <EditOutlined /> 编辑
        </a>,
        record.default ? (
          <Typography.Text key="delete-disabled" className={styles.muted}>
            <DeleteOutlined /> 删除
          </Typography.Text>
        ) : (
          <Popconfirm
            key="delete"
            title="确认删除该集群吗？"
            onConfirm={async () => {
              await deleteCluster(record.id)
              message.success('集群已删除')
              actionRef.current?.reload()
            }}
          >
            <a>
              <DeleteOutlined /> 删除
            </a>
          </Popconfirm>
        ),
      ],
    },
  ]

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'pages.clusters.title',
        defaultMessage: '集群管理',
      })}
    >
      <ProTable<API.ClusterItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        request={async () => {
          const res = await getClusterList()
          return {
            data: res.data.items || [],
            success: true,
          }
        }}
        headerTitle={
          <div className={styles.toolbar}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateVisible(true)}
            >
              新建集群
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setImportVisible(true)}
            >
              导入 kubeconfig
            </Button>
          </div>
        }
      />

      <ModalForm<ClusterFormValues>
        title="新建集群"
        open={createVisible}
        width={820}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setCreateVisible(false),
        }}
        initialValues={{
          auth_type: 'bearer_token',
          enabled: true,
        }}
        onFinish={async (values) => {
          await createCluster(buildClusterPayload(values))
          message.success('集群创建成功')
          setCreateVisible(false)
          actionRef.current?.reload()
          return true
        }}
      >
        {renderClusterFormFields(intl)}
      </ModalForm>

      <ModalForm<ClusterFormValues>
        title="编辑集群"
        open={editVisible}
        width={820}
        initialValues={editingCluster}
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
          await updateCluster(editingCluster.id, buildClusterPayload(values))
          message.success('集群更新成功')
          setEditVisible(false)
          setEditingCluster(undefined)
          actionRef.current?.reload()
          return true
        }}
      >
        {renderClusterFormFields(intl, true)}
      </ModalForm>

      <ModalForm<ClusterFormValues>
        title="导入 kubeconfig"
        open={importVisible}
        width={720}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setImportVisible(false),
        }}
        initialValues={{
          enabled: true,
          skip_unsupported: true,
        }}
        onFinish={async (values) => {
          const res = await importKubeconfig(buildImportPayload(values))
          message.success(`已导入 ${res.data.items?.length || 0} 个集群`)
          if (res.data.skipped?.length) {
            message.warning(`已跳过：${res.data.skipped.join(', ')}`)
          }
          setImportVisible(false)
          actionRef.current?.reload()
          return true
        }}
      >
        <ProFormTextArea
          name="kubeconfig"
          label="Kubeconfig"
          rules={[{ required: true, message: '请粘贴 kubeconfig' }]}
          fieldProps={{ rows: 10 }}
        />
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <ProFormText
              name="context_names_text"
              label="导入 Context"
              placeholder="留空导入全部，多个值用英文逗号分隔"
            />
          </Col>
          <Col xs={24} md={12}>
            <ProFormText name="default_context" label="默认 Context" />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <ProFormSwitch name="enabled" label="导入后启用" initialValue />
          </Col>
          <Col xs={24} md={12}>
            <ProFormSwitch name="skip_unsupported" label="跳过不支持的 Context" />
          </Col>
        </Row>
      </ModalForm>

      <Drawer
        title={viewingCluster?.name || '集群详情'}
        width={620}
        open={Boolean(viewingCluster)}
        onClose={() => setViewingCluster(undefined)}
      >
        {viewingCluster && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="状态">
              {viewingCluster.enabled ? (
                <Tag color="success">启用</Tag>
              ) : (
                <Tag color="default">禁用</Tag>
              )}
              {viewingCluster.default && <Tag color="blue">默认</Tag>}
            </Descriptions.Item>
            {detailItems.map((item) => (
              <Descriptions.Item key={item.label} label={item.label}>
                {renderText(item.value)}
              </Descriptions.Item>
            ))}
            <Descriptions.Item label="创建时间">
              {viewingCluster.created_at}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {viewingCluster.updated_at}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  )
}

export default ClusterManagementPage
