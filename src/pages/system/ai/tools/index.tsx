import { EditOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Typography } from 'antd';
import { useRef, useState } from 'react';
import { ClusterTableSearch } from '@/components';
import {
  getAgentSkillList,
  getAgentToolList,
  reloadAgentRuntime,
} from '@/services/kubeflare/agent';
import {
  AgentTypeTags,
  EnabledTag,
  ReadOnlyTag,
  ToolOriginTag,
  ToolSourceTag,
} from '../components/AgentTags';
import ToolDetailDrawer from '../components/ToolDetailDrawer';
import ToolOverrideDrawer, {
  type ToolOverrideFormValues,
} from '../components/ToolOverrideDrawer';
import {
  buildSkillPayload,
  buildToolOverrides,
  ensureStringList,
  getErrorMessage,
  matchKeyword,
} from '../utils';

const TABLE_DEFAULT_PAGE_SIZE = 10;

const Tools = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const [tools, setTools] = useState<API.AgentToolDefinition[]>([]);
  const [detailTool, setDetailTool] = useState<API.AgentToolDefinition>();
  const [editingTool, setEditingTool] = useState<API.AgentToolDefinition>();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSaveTool = async (values: ToolOverrideFormValues) => {
    if (!editingTool) {
      return false;
    }

    setSaving(true);
    try {
      const nextTools = tools.map((tool) =>
        tool.id === editingTool.id
          ? {
              ...tool,
              description: values.description.trim(),
              enabled: values.enabled,
              read_only: values.read_only,
              timeout_ms: values.timeout_ms,
            }
          : tool,
      );
      const skillsRes = await getAgentSkillList({ skipErrorHandler: true });

      await reloadAgentRuntime(
        {
          overrides: buildToolOverrides(nextTools),
          skills: buildSkillPayload(skillsRes.data.items || []),
        },
        { skipErrorHandler: true },
      );
      message.success('工具配置已更新');
      setEditingTool(undefined);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error(getErrorMessage(error, '工具配置更新失败'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await reloadAgentRuntime({ reset: true }, { skipErrorHandler: true });
      message.success('已回滚到启动配置');
      actionRef.current?.reloadAndRest?.();
    } catch (error) {
      message.error(getErrorMessage(error, '回滚失败'));
    } finally {
      setResetting(false);
    }
  };

  const columns: ProColumns<API.AgentToolDefinition>[] = [
    {
      title: '工具',
      dataIndex: 'name',
      width: 220,
      ellipsis: true,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <a onClick={() => setDetailTool(record)}>{record.name}</a>
          <Typography.Text type="secondary" copyable>
            {record.id}
          </Typography.Text>
        </Space>
      ),
    },
    { title: '分类', dataIndex: 'category', width: 120, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (_, record) => <EnabledTag enabled={record.enabled} />,
    },
    {
      title: '属性',
      dataIndex: 'read_only',
      width: 110,
      render: (_, record) => <ReadOnlyTag readOnly={record.read_only} />,
    },
    {
      title: '数据源',
      dataIndex: 'source',
      width: 100,
      render: (_, record) => <ToolSourceTag value={record.source} />,
    },
    {
      title: '来源',
      dataIndex: 'origin',
      width: 100,
      render: (_, record) => <ToolOriginTag value={record.origin} />,
    },
    {
      title: 'Agent',
      dataIndex: 'agent_types',
      width: 220,
      render: (_, record) => <AgentTypeTags values={record.agent_types} />,
    },
    {
      title: '超时',
      dataIndex: 'timeout_ms',
      width: 110,
      renderText: (_, record) => `${record.timeout_ms} ms`,
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
      width: 150,
      fixed: 'right',
      render: (_, record) => [
        <a key="detail" onClick={() => setDetailTool(record)}>
          <EyeOutlined /> 详情
        </a>,
        <a key="edit" onClick={() => setEditingTool(record)}>
          <EditOutlined /> 编辑
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title="工具治理">
      <ProTable<API.AgentToolDefinition>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        scroll={{ x: 1500 }}
        pagination={{ defaultPageSize: TABLE_DEFAULT_PAGE_SIZE }}
        request={async (params) => {
          const res = await getAgentToolList();
          const items = (res.data.items || []).filter((item) => {
            const agentTypes = ensureStringList(item.agent_types);

            return matchKeyword(
              [
                item.id,
                item.name,
                item.category,
                item.description,
                item.source,
                item.origin,
                ...agentTypes,
              ],
              keywordRef.current,
            );
          });
          setTools(res.data.items || []);

          const current = params.current || 1;
          const pageSize = params.pageSize || TABLE_DEFAULT_PAGE_SIZE;

          return {
            data: items.slice((current - 1) * pageSize, current * pageSize),
            success: true,
            total: items.length,
          };
        }}
        headerTitle={
          <Space>
            <ClusterTableSearch
              clearTriggersSearch
              placeholder="搜索工具 ID / 名称 / 分类"
              style={{ width: 300 }}
              onSearch={(value) => {
                keywordRef.current = value;
                actionRef.current?.reloadAndRest?.();
              }}
            />
            <Popconfirm
              title="确认回滚 Agent 运行时配置吗？"
              description="将回滚工具覆盖与技能配置到服务启动时的快照。"
              okText="回滚"
              cancelText="取消"
              onConfirm={handleReset}
            >
              <Button icon={<ReloadOutlined />} loading={resetting}>
                回滚启动配置
              </Button>
            </Popconfirm>
          </Space>
        }
      />
      <ToolDetailDrawer
        open={Boolean(detailTool)}
        tool={detailTool}
        onClose={() => setDetailTool(undefined)}
      />
      <ToolOverrideDrawer
        open={Boolean(editingTool)}
        tool={editingTool}
        loading={saving}
        onClose={() => setEditingTool(undefined)}
        onSubmit={handleSaveTool}
      />
    </PageContainer>
  );
};

export default Tools;
