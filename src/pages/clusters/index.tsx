import type { ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { useIntl } from '@umijs/max'
import { Tag, Tooltip } from 'antd'
import React from 'react'

const emptyText = '-'

type ClusterCondition = {
  message?: string
  reason?: string
  status: 'True' | 'False' | 'Unknown'
  type: string
}

type ClusterItem = {
  metadata?: {
    creationTimestamp?: string
    name?: string
    resourceVersion?: string
    uid?: string
  }
  status?: {
    conditions?: ClusterCondition[]
    kubernetesVersion?: string
    nodeCount?: number
    uid?: string
  }
}

const clusterData: ClusterItem[] = []

const getClusterStatus = (record: ClusterItem) => {
  const conditions = record.status?.conditions || []
  const condition =
    conditions.find((item) => item.type === 'Ready') || conditions[0]

  if (!condition) {
    return undefined
  }

  return condition
}

const getStatusTagColor = (status?: ClusterCondition['status']) => {
  if (status === 'True') {
    return 'success'
  }

  if (status === 'False') {
    return 'error'
  }

  return 'warning'
}

const getStatusText = (
  intl: ReturnType<typeof useIntl>,
  status: ClusterCondition['status'],
) => {
  const statusTextMap: Record<ClusterCondition['status'], string> = {
    True: intl.formatMessage({
      id: 'pages.clusters.status.true',
      defaultMessage: '正常',
    }),
    False: intl.formatMessage({
      id: 'pages.clusters.status.false',
      defaultMessage: '异常',
    }),
    Unknown: intl.formatMessage({
      id: 'pages.clusters.status.unknown',
      defaultMessage: '未知',
    }),
  }

  return statusTextMap[status]
}

const ClusterManagementPage: React.FC = () => {
  const intl = useIntl()

  const columns: ProColumns<ClusterItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.clusters.name',
        defaultMessage: '集群名称',
      }),
      dataIndex: ['metadata', 'name'],
      copyable: true,
      renderText: (_, record) => record.metadata?.name || emptyText,
    },
    {
      title: intl.formatMessage({
        id: 'pages.clusters.version',
        defaultMessage: '集群版本',
      }),
      dataIndex: ['status', 'kubernetesVersion'],
      width: 160,
      renderText: (_, record) => record.status?.kubernetesVersion || emptyText,
    },
    {
      title: intl.formatMessage({
        id: 'pages.clusters.nodeCount',
        defaultMessage: '节点数量',
      }),
      dataIndex: ['status', 'nodeCount'],
      width: 120,
      renderText: (_, record) => record.status?.nodeCount ?? emptyText,
    },
    {
      title: intl.formatMessage({
        id: 'pages.clusters.status',
        defaultMessage: '集群状态',
      }),
      dataIndex: ['status', 'conditions'],
      width: 160,
      render: (_, record) => {
        const condition = getClusterStatus(record)

        if (!condition) {
          return emptyText
        }

        const text = `${condition.type}: ${getStatusText(
          intl,
          condition.status,
        )}`
        const tag = (
          <Tag color={getStatusTagColor(condition.status)}>{text}</Tag>
        )

        if (!condition.message && !condition.reason) {
          return tag
        }

        return (
          <Tooltip title={condition.message || condition.reason}>{tag}</Tooltip>
        )
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.clusters.createdAt',
        defaultMessage: '创建时间',
      }),
      dataIndex: ['metadata', 'creationTimestamp'],
      valueType: 'dateTime',
      width: 180,
      renderText: (_, record) => record.metadata?.creationTimestamp || emptyText,
    },
  ]

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'pages.clusters.title',
        defaultMessage: '集群管理',
      })}
    >
      <ProTable<ClusterItem>
        rowKey={(record) =>
          record.metadata?.uid ||
          record.status?.uid ||
          record.metadata?.name ||
          record.metadata?.resourceVersion ||
          ''
        }
        search={false}
        columns={columns}
        dataSource={clusterData}
        pagination={false}
        headerTitle={intl.formatMessage({
          id: 'pages.clusters.list',
          defaultMessage: '集群列表',
        })}
      />
    </PageContainer>
  )
}

export default ClusterManagementPage
