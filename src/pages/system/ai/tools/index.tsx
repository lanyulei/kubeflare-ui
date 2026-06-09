import {
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  ReloadOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Space, Typography } from 'antd';
import { useRef, useState } from 'react';
import { ClusterTableSearch } from '@/components';
import {
  getAgentToolList,
  reloadAgentRuntime,
  rollbackAgentRuntimeConfigVersion,
} from '@/services/kubeflare/agent';
import {
  AgentTypeTags,
  EnabledTag,
  ReadOnlyTag,
  ToolOriginTag,
  ToolSourceTag,
} from '../components/AgentTags';
import RuntimeChangeReasonModal from '../components/RuntimeChangeReasonModal';
import RuntimeHistoryDrawer from '../components/RuntimeHistoryDrawer';
import ToolDetailDrawer from '../components/ToolDetailDrawer';
import ToolOverrideDrawer, {
  type ToolOverrideFormValues,
} from '../components/ToolOverrideDrawer';
import {
  buildToolOverridePatch,
  ensureStringList,
  getErrorMessage,
  matchKeyword,
  toReloadToolOverride,
} from '../utils';

const TABLE_DEFAULT_PAGE_SIZE = 10;

type PendingRuntimeChange =
  | { type: 'restore'; tool: API.AgentToolDefinition }
  | { type: 'reset' }
  | { type: 'rollback'; version: API.AgentRuntimeConfigVersion };

const Tools = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const [detailTool, setDetailTool] = useState<API.AgentToolDefinition>();
  const [editingTool, setEditingTool] = useState<API.AgentToolDefinition>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [pendingChange, setPendingChange] = useState<PendingRuntimeChange>();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const handleSaveTool = async (values: ToolOverrideFormValues) => {
    if (!editingTool) {
      return false;
    }

    setSaving(true);
    try {
      const nextTool = {
        ...editingTool,
        description: values.description.trim(),
        enabled: values.enabled,
        read_only: values.read_only,
        timeout_ms: values.timeout_ms,
      };
      const res = await reloadAgentRuntime(
        {
          overrides: buildToolOverridePatch(
            editingTool.id,
            toReloadToolOverride(nextTool),
          ),
        },
        { skipErrorHandler: true },
      );
      const versionText = res.data.version ? `，版本 #${res.data.version}` : '';
      if (res.data.changed) {
        message.success(`工具配置已更新${versionText}`);
      } else {
        message.info('工具配置无变化');
      }
      setEditingTool(undefined);
      if (res.data.changed) {
        setHistoryRefreshKey((value) => value + 1);
      }
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error(getErrorMessage(error, '工具配置更新失败'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPendingChange({ type: 'reset' });
  };

  const handleRestoreTool = (tool: API.AgentToolDefinition) => {
    setPendingChange({ type: 'restore', tool });
  };

  const handleRollback = (version: API.AgentRuntimeConfigVersion) => {
    setPendingChange({ type: 'rollback', version });
  };

  const submitRuntimeChange = async (reason: string) => {
    if (!pendingChange) {
      return;
    }

    try {
      if (pendingChange.type === 'reset') {
        setResetting(true);
        const res = await reloadAgentRuntime(
          { reason, reset: true },
          { skipErrorHandler: true },
        );
        const versionText = res.data.version
          ? `，版本 #${res.data.version}`
          : '';
        message.success(`已回滚到启动配置${versionText}`);
      }

      if (pendingChange.type === 'restore') {
        setSaving(true);
        const res = await reloadAgentRuntime(
          {
            reason,
            remove_overrides: [pendingChange.tool.id],
          },
          { skipErrorHandler: true },
        );
        const versionText = res.data.version
          ? `，版本 #${res.data.version}`
          : '';
        message.success(`工具已恢复默认${versionText}`);
      }

      if (pendingChange.type === 'rollback') {
        setRollingBack(true);
        const res = await rollbackAgentRuntimeConfigVersion(
          pendingChange.version.id,
          { reason },
          { skipErrorHandler: true },
        );
        const versionText = res.data.version
          ? `，版本 #${res.data.version}`
          : '';
        message.success(
          `已回滚到版本 #${pendingChange.version.version}${versionText}`,
        );
      }

      setPendingChange(undefined);
      setHistoryRefreshKey((value) => value + 1);
      actionRef.current?.reload();
    } catch (error) {
      message.error(getErrorMessage(error, 'Agent 运行时配置保存失败'));
    } finally {
      setSaving(false);
      setResetting(false);
      setRollingBack(false);
    }
  };

  const reasonModalTitle =
    pendingChange?.type === 'restore'
      ? `恢复工具默认 / ${pendingChange.tool.name}`
      : pendingChange?.type === 'rollback'
        ? `回滚到版本 #${pendingChange.version.version}`
        : '回滚启动配置';
  const reasonModalConfirm =
    pendingChange?.type === 'restore' ? '恢复' : '确认回滚';
  const reasonModalLoading = saving || resetting || rollingBack;

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
      width: 130,
      render: (_, record) => (
        <Space size={4}>
          <EnabledTag enabled={record.enabled} />
          {record.overridden ? (
            <Typography.Text type="warning">已覆盖</Typography.Text>
          ) : null}
        </Space>
      ),
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
      width: 210,
      fixed: 'right',
      render: (_, record) =>
        [
          <a key="detail" onClick={() => setDetailTool(record)}>
            <EyeOutlined /> 详情
          </a>,
          <a key="edit" onClick={() => setEditingTool(record)}>
            <EditOutlined /> 编辑
          </a>,
          record.overridden ? (
            <a key="restore" onClick={() => handleRestoreTool(record)}>
              <RollbackOutlined /> 恢复默认
            </a>
          ) : null,
        ].filter(Boolean),
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
          const nextTools = res.data.items || [];
          const items = nextTools.filter((item) => {
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
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setHistoryOpen(true)}
            >
              配置历史
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={resetting}
              onClick={handleReset}
            >
              回滚启动配置
            </Button>
          </Space>
        }
      />
      <RuntimeHistoryDrawer
        open={historyOpen}
        refreshKey={historyRefreshKey}
        rollingBack={rollingBack}
        onClose={() => setHistoryOpen(false)}
        onRollback={handleRollback}
      />
      <RuntimeChangeReasonModal
        danger
        open={Boolean(pendingChange)}
        title={reasonModalTitle}
        confirmText={reasonModalConfirm}
        loading={reasonModalLoading}
        onCancel={() => {
          if (!reasonModalLoading) {
            setPendingChange(undefined);
          }
        }}
        onSubmit={submitRuntimeChange}
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
