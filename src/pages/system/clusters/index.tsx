import type { ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { useIntl } from '@umijs/max'
import { Tag } from 'antd'
import React from 'react'

type ClusterItem = {
  id: string
  name: string
  provider: string
  region: string
  version: string
  nodeCount: number
  status: 'running' | 'maintenance' | 'offline'
  endpoint: string
  updatedAt: string
}

const clusterList: ClusterItem[] = [
  {
    id: 'cls-prod-01',
    name: 'production-east',
    provider: 'AWS',
    region: 'us-east-1',
    version: 'v1.30.8',
    nodeCount: 18,
    status: 'running',
    endpoint: 'https://api.prod-east.kubeflare.local',
    updatedAt: '2026-04-20 14:32:00',
  },
  {
    id: 'cls-stage-01',
    name: 'staging',
    provider: 'GCP',
    region: 'asia-east1',
    version: 'v1.29.12',
    nodeCount: 6,
    status: 'maintenance',
    endpoint: 'https://api.staging.kubeflare.local',
    updatedAt: '2026-04-18 09:16:00',
  },
  {
    id: 'cls-edge-01',
    name: 'edge-shanghai',
    provider: 'Bare Metal',
    region: 'cn-shanghai',
    version: 'v1.28.15',
    nodeCount: 4,
    status: 'offline',
    endpoint: 'https://api.edge-shanghai.kubeflare.local',
    updatedAt: '2026-04-12 20:08:00',
  },
]

const ClusterManagementPage: React.FC = () => {
  const intl = useIntl()

  const statusConfig: Record<
    ClusterItem['status'],
    { color: string; text: string }
  > = {
    running: {
      color: 'success',
      text: intl.formatMessage({
        id: 'pages.system.clusters.status.running',
        defaultMessage: '运行中',
      }),
    },
    maintenance: {
      color: 'warning',
      text: intl.formatMessage({
        id: 'pages.system.clusters.status.maintenance',
        defaultMessage: '维护中',
      }),
    },
    offline: {
      color: 'default',
      text: intl.formatMessage({
        id: 'pages.system.clusters.status.offline',
        defaultMessage: '离线',
      }),
    },
  }

  const columns: ProColumns<ClusterItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.system.clusters.name',
        defaultMessage: '集群名称',
      }),
      dataIndex: 'name',
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.clusters.provider',
        defaultMessage: '供应商',
      }),
      dataIndex: 'provider',
      width: 120,
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.clusters.region',
        defaultMessage: '区域',
      }),
      dataIndex: 'region',
      width: 140,
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.clusters.version',
        defaultMessage: 'Kubernetes 版本',
      }),
      dataIndex: 'version',
      width: 150,
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.clusters.nodeCount',
        defaultMessage: '节点数',
      }),
      dataIndex: 'nodeCount',
      width: 100,
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.clusters.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      width: 120,
      render: (_, record) => {
        const status = statusConfig[record.status]
        return <Tag color={status.color}>{status.text}</Tag>
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.clusters.endpoint',
        defaultMessage: '访问地址',
      }),
      dataIndex: 'endpoint',
      ellipsis: true,
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.clusters.updatedAt',
        defaultMessage: '更新时间',
      }),
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      width: 180,
    },
  ]

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'pages.system.clusters.title',
        defaultMessage: '集群管理',
      })}
    >
      <ProTable<ClusterItem>
        rowKey="id"
        search={false}
        columns={columns}
        dataSource={clusterList}
        pagination={false}
        headerTitle={intl.formatMessage({
          id: 'pages.system.clusters.list',
          defaultMessage: '集群列表',
        })}
      />
    </PageContainer>
  )
}

export default ClusterManagementPage
