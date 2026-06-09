import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Tag, Typography } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { ClusterTableSearch } from '@/components';
import {
  getAgentSkillList,
  getAgentToolList,
  reloadAgentRuntime,
} from '@/services/kubeflare/agent';
import { AgentTypeTags, EnabledTag } from '../components/AgentTags';
import SkillDetailDrawer from '../components/SkillDetailDrawer';
import SkillFormDrawer, {
  type SkillFormValues,
} from '../components/SkillFormDrawer';
import {
  buildSkillPayload,
  buildToolOverrides,
  ensureStringList,
  getErrorMessage,
  matchKeyword,
} from '../utils';

const TABLE_DEFAULT_PAGE_SIZE = 10;

const renderTextTags = (items?: string[] | null, max = 3) => {
  const normalizedItems = ensureStringList(items);

  if (!normalizedItems.length) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }

  return (
    <Space size={[0, 6]} wrap>
      {normalizedItems.slice(0, max).map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
      {normalizedItems.length > max ? (
        <Tag>+{normalizedItems.length - max}</Tag>
      ) : null}
    </Space>
  );
};

const toSkillDefinition = (
  values: SkillFormValues,
): API.AgentSkillDefinition => ({
  id: values.id.trim(),
  name: values.name.trim(),
  description: values.description || '',
  enabled: values.enabled,
  agent_types: values.agent_types || [],
  triggers: values.triggers || [],
  system_prompt: values.system_prompt || '',
  allowed_tools: values.allowed_tools || [],
  hints: values.hints || [],
});

const Skills = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const [skills, setSkills] = useState<API.AgentSkillDefinition[]>([]);
  const [tools, setTools] = useState<API.AgentToolDefinition[]>([]);
  const [detailSkill, setDetailSkill] = useState<API.AgentSkillDefinition>();
  const [editingSkill, setEditingSkill] = useState<API.AgentSkillDefinition>();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const toolOptions = useMemo(
    () =>
      tools.map((tool) => ({
        label: `${tool.name} (${tool.id})`,
        value: tool.id,
      })),
    [tools],
  );

  const ensureTools = async () => {
    if (tools.length) {
      return tools;
    }

    const res = await getAgentToolList({ skipErrorHandler: true });
    const items = res.data.items || [];
    setTools(items);
    return items;
  };

  const reloadSkills = async (
    nextSkills: API.AgentSkillDefinition[],
    successText: string,
  ) => {
    setSaving(true);
    try {
      const currentTools = await ensureTools();
      await reloadAgentRuntime(
        {
          overrides: buildToolOverrides(currentTools),
          skills: buildSkillPayload(nextSkills),
        },
        { skipErrorHandler: true },
      );
      message.success(successText);
      setCreateOpen(false);
      setEditingSkill(undefined);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error(getErrorMessage(error, '技能配置保存失败'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (values: SkillFormValues) => {
    const nextSkill = toSkillDefinition(values);
    if (skills.some((skill) => skill.id === nextSkill.id)) {
      message.warning('技能 ID 已存在');
      return false;
    }

    return reloadSkills([...skills, nextSkill], '技能已创建');
  };

  const handleEdit = async (values: SkillFormValues) => {
    if (!editingSkill) {
      return false;
    }

    const nextSkill = toSkillDefinition(values);
    return reloadSkills(
      skills.map((skill) => (skill.id === editingSkill.id ? nextSkill : skill)),
      '技能已更新',
    );
  };

  const handleDelete = async (skillID: string) => {
    await reloadSkills(
      skills.filter((skill) => skill.id !== skillID),
      '技能已删除',
    );
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

  const columns: ProColumns<API.AgentSkillDefinition>[] = [
    {
      title: '技能',
      dataIndex: 'name',
      width: 240,
      ellipsis: true,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <a onClick={() => setDetailSkill(record)}>{record.name}</a>
          <Typography.Text type="secondary" copyable>
            {record.id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (_, record) => <EnabledTag enabled={record.enabled} />,
    },
    {
      title: 'Agent',
      dataIndex: 'agent_types',
      width: 220,
      render: (_, record) => <AgentTypeTags values={record.agent_types} />,
    },
    {
      title: '触发词',
      dataIndex: 'triggers',
      width: 260,
      render: (_, record) => renderTextTags(record.triggers),
    },
    {
      title: '允许工具',
      dataIndex: 'allowed_tools',
      width: 180,
      render: (_, record) => {
        const allowedTools = ensureStringList(record.allowed_tools);

        return allowedTools.length ? (
          <Tag color="blue">{allowedTools.length} 个工具</Tag>
        ) : (
          <Typography.Text type="secondary">不收窄</Typography.Text>
        );
      },
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
      width: 190,
      fixed: 'right',
      render: (_, record) => [
        <a key="detail" onClick={() => setDetailSkill(record)}>
          <EyeOutlined /> 详情
        </a>,
        <a key="edit" onClick={() => setEditingSkill(record)}>
          <EditOutlined /> 编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除该技能吗？"
          description="删除后命中的问题将不再自动追加该技能约束。"
          okButtonProps={{ danger: true }}
          okText="删除"
          cancelText="取消"
          onConfirm={() => handleDelete(record.id)}
        >
          <a>
            <DeleteOutlined /> 删除
          </a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer title="技能管理">
      <ProTable<API.AgentSkillDefinition>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        scroll={{ x: 1360 }}
        pagination={{ defaultPageSize: TABLE_DEFAULT_PAGE_SIZE }}
        request={async (params) => {
          const [skillRes, toolRes] = await Promise.all([
            getAgentSkillList(),
            getAgentToolList(),
          ]);
          const nextSkills = skillRes.data.items || [];
          const nextTools = toolRes.data.items || [];
          const items = nextSkills.filter((item) => {
            const agentTypes = ensureStringList(item.agent_types);
            const triggers = ensureStringList(item.triggers);
            const allowedTools = ensureStringList(item.allowed_tools);
            const hints = ensureStringList(item.hints);

            return matchKeyword(
              [
                item.id,
                item.name,
                item.description,
                item.system_prompt,
                ...agentTypes,
                ...triggers,
                ...allowedTools,
                ...hints,
              ],
              keywordRef.current,
            );
          });

          setSkills(nextSkills);
          setTools(nextTools);

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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              新建
            </Button>
            <ClusterTableSearch
              clearTriggersSearch
              placeholder="搜索技能 ID / 名称 / 触发词"
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
      <SkillDetailDrawer
        open={Boolean(detailSkill)}
        skill={detailSkill}
        onClose={() => setDetailSkill(undefined)}
      />
      <SkillFormDrawer
        mode="create"
        open={createOpen}
        loading={saving}
        toolOptions={toolOptions}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <SkillFormDrawer
        mode="edit"
        open={Boolean(editingSkill)}
        skill={editingSkill}
        loading={saving}
        toolOptions={toolOptions}
        onClose={() => setEditingSkill(undefined)}
        onSubmit={handleEdit}
      />
    </PageContainer>
  );
};

export default Skills;
