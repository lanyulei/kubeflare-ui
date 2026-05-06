import { SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Input, Space, Tag } from 'antd';
import { useRef } from 'react';
import { getClusterNodeList } from '@/services/kubeflare/cluster/node';

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const getNodeStatusTag = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'ready') {
    return <Tag color="success">{status}</Tag>;
  }
  if (normalizedStatus === 'notready' || normalizedStatus === 'unknown') {
    return <Tag color="error">{status}</Tag>;
  }
  if (normalizedStatus === 'schedulingdisabled') {
    return <Tag color="warning">{status}</Tag>;
  }
  return <Tag color="default">{status || '-'}</Tag>;
};

const getNodeIp = (record: API.ClusterNodeItem) =>
  record.ip || record.internal_ip || record.external_ip || '-';

const getNodeVersion = (record: API.ClusterNodeItem) =>
  record.version || record.kubelet_version || '-';

const getNodeRoles = (roles?: string[] | string) => {
  if (Array.isArray(roles)) {
    return roles;
  }
  if (roles) {
    return roles
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);
  }
  return [];
};

const matchNodeKeyword = (record: API.ClusterNodeItem, keyword: string) => {
  if (!keyword) {
    return true;
  }
  const normalizedKeyword = keyword.toLowerCase();
  return [record.name, getNodeIp(record)]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedKeyword));
};

const ClusterNodes = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');

  const columns: ProColumns<API.ClusterNodeItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodes.name',
        defaultMessage: '名称',
      }),
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodes.ip',
        defaultMessage: 'IP 地址',
      }),
      dataIndex: 'ip',
      copyable: true,
      renderText: (_, record) => getNodeIp(record),
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodes.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      width: 120,
      render: (_, record) => getNodeStatusTag(record.status),
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodes.roles',
        defaultMessage: '角色',
      }),
      dataIndex: 'roles',
      render: (_, record) => {
        const roles = getNodeRoles(record.roles);
        if (!roles.length) {
          return '-';
        }
        return (
          <Space size={[0, 6]} wrap>
            {roles.map((role) => (
              <Tag key={role}>{role}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodes.uptime',
        defaultMessage: '运行时间',
      }),
      dataIndex: 'uptime',
      width: 160,
      renderText: (_, record) => record.uptime || record.age || '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodes.version',
        defaultMessage: '版本',
      }),
      dataIndex: 'version',
      ellipsis: true,
      renderText: (_, record) => getNodeVersion(record),
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'pages.cluster.nodes.title',
        defaultMessage: '集群节点',
      })}
    >
      <ProTable<API.ClusterNodeItem>
        rowKey="name"
        actionRef={actionRef}
        search={false}
        columns={columns}
        scroll={{ x: 900 }}
        request={async () => {
          const res = await getClusterNodeList({
            keyword: normalizeOptionalText(keywordRef.current),
          });
          const items = res.data.items || [];
          return {
            data: items.filter((item) =>
              matchNodeKeyword(item, keywordRef.current),
            ),
            success: true,
          };
        }}
        headerTitle={
          <Input
            allowClear
            suffix={<SearchOutlined />}
            style={{ width: 260 }}
            placeholder={intl.formatMessage({
              id: 'pages.cluster.nodes.search.placeholder',
              defaultMessage: '搜索节点名称 / IP 地址',
            })}
            onChange={(event) => {
              keywordRef.current = event.target.value.trim();
              actionRef.current?.reload();
            }}
          />
        }
      />
    </PageContainer>
  );
};

export default ClusterNodes;
