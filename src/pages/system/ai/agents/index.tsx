import { EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Space, Tag, Typography } from 'antd';
import { useRef, useState } from 'react';
import { ClusterTableSearch } from '@/components';
import { getAgentList } from '@/services/kubeflare/agent';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import AgentDetailDrawer from '../components/AgentDetailDrawer';
import { AgentTypeTag, EnabledTag } from '../components/AgentTags';
import { ensureStringList, matchKeyword } from '../utils';

const TABLE_DEFAULT_PAGE_SIZE = 10;

const Agents = () => {
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const [detailAgent, setDetailAgent] = useState<API.AgentDefinition>();

  const columns: ProColumns<API.AgentDefinition>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => setDetailAgent(record)}>{record.name}</a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 160,
      render: (_, record) => <AgentTypeTag value={record.type} />,
    },
    {
      title: '状态',
      dataIndex: 'available',
      width: 100,
      render: (_, record) => <EnabledTag enabled={record.available} />,
    },
    { title: '版本', dataIndex: 'version', width: 90 },
    {
      title: '能力',
      dataIndex: 'capabilities',
      width: 260,
      render: (_, record) => {
        const capabilities = ensureStringList(record.capabilities);

        return (
          <Space size={[0, 6]} wrap>
            {capabilities.slice(0, 3).map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
            {capabilities.length > 3 ? (
              <Tag>+{capabilities.length - 3}</Tag>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: '默认工具',
      dataIndex: 'default_tools',
      width: 110,
      renderText: (_, record) =>
        `${ensureStringList(record.default_tools).length} 个`,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (_, record) => (
        <Typography.Text type="secondary">
          {record.description || '-'}
        </Typography.Text>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: (_, record) => [
        <a key="detail" onClick={() => setDetailAgent(record)}>
          <EyeOutlined /> 详情
        </a>,
      ],
    },
  ];
  const tableColumns = withComfortableTableColumns(columns);

  return (
    <PageContainer title="Agent 总览">
      <ProTable<API.AgentDefinition>
        rowKey="type"
        actionRef={actionRef}
        search={false}
        columns={tableColumns}
        scroll={getComfortableTableScroll(tableColumns, { x: 1180 })}
        pagination={{ defaultPageSize: TABLE_DEFAULT_PAGE_SIZE }}
        request={async (params) => {
          const res = await getAgentList();
          const items = (res.data.items || []).filter((item) => {
            const capabilities = ensureStringList(item.capabilities);

            return matchKeyword(
              [item.type, item.name, item.description, ...capabilities],
              keywordRef.current,
            );
          });
          const current = params.current || 1;
          const pageSize = params.pageSize || TABLE_DEFAULT_PAGE_SIZE;

          return {
            data: items.slice((current - 1) * pageSize, current * pageSize),
            success: true,
            total: items.length,
          };
        }}
        headerTitle={
          <ClusterTableSearch
            clearTriggersSearch
            placeholder="搜索 Agent 类型 / 名称 / 能力"
            style={{ width: 300 }}
            onSearch={(value) => {
              keywordRef.current = value;
              actionRef.current?.reloadAndRest?.();
            }}
          />
        }
      />
      <AgentDetailDrawer
        open={Boolean(detailAgent)}
        agent={detailAgent}
        onClose={() => setDetailAgent(undefined)}
      />
    </PageContainer>
  );
};

export default Agents;
