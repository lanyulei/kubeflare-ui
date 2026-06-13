import {
  HistoryOutlined,
  ReloadOutlined,
  ToolOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Space,
  Spin,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import {
  getAgentRuntimeStatus,
  rollbackAgentRuntimeConfigVersion,
} from '@/services/kubeflare/agent';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import RuntimeChangeReasonModal from '../components/RuntimeChangeReasonModal';
import RuntimeHistoryDrawer from '../components/RuntimeHistoryDrawer';
import { getErrorMessage } from '../utils';

const CURRENT_CLUSTER_STORAGE_KEY = 'kubeflare.currentClusterId';
const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';

const useStyles = createStyles(({ token }) => ({
  body: {
    display: 'grid',
    gap: token.marginLG,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: token.marginMD,

    '@media (max-width: 1180px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 760px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    borderRadius: 8,
  },
  tagWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: token.marginXS,
  },
}));

const FEATURE_LABELS: Record<keyof API.AgentRuntimeFeatureStatus, string> = {
  case_library: '案例库',
  hypothesis_ledger: '假设台账',
  llm_routing: 'LLM 路由',
  observe_compression: '观察压缩',
  planning: '计划生成',
  playbook: '诊断剧本',
  reflection: '反思校验',
  replanning: '动态重规划',
  route_learning: '路由学习',
  semantic_retrieval: '语义检索',
  stream_think: '流式思考',
};

const EMPTY_FEATURES: API.AgentRuntimeFeatureStatus = {
  case_library: false,
  hypothesis_ledger: false,
  llm_routing: false,
  observe_compression: false,
  planning: false,
  playbook: false,
  reflection: false,
  replanning: false,
  route_learning: false,
  semantic_retrieval: false,
  stream_think: false,
};

const EMPTY_LOOP: API.AgentRuntimeLoopStatus = {
  case_cache_size: 0,
  case_few_shot_limit: 0,
  max_reflection_steps: 0,
  max_reflections: 0,
  max_replans: 0,
  max_steps: 0,
  max_token_budget: 0,
  max_tool_errors_per_step: 0,
  reflection_jurors: 0,
  replan_interval: 0,
  route_cache_size: 0,
  route_few_shot_limit: 0,
  step_timeout_ms: 0,
  tool_choice: '',
};

const EMPTY_CONCURRENCY: API.AgentRuntimeConcurrencyStatus = {
  distributed_semaphore: false,
  max_concurrent_runs: 0,
  max_concurrent_runs_per_user: 0,
};

const EMPTY_REPOSITORIES: API.AgentRuntimeRepositoryStatus = {
  diagnosis_case: false,
  embedding: false,
  route_feedback: false,
  run_feedback: false,
  run_metrics: false,
  runtime_config: false,
};

const EMPTY_TOOLS: API.AgentRuntimeToolStatus = {
  disabled: 0,
  enabled: 0,
  mcp: 0,
  prometheus: 0,
  total: 0,
};

const EMPTY_SKILLS: API.AgentRuntimeSkillStatus = {
  disabled: 0,
  enabled: 0,
  total: 0,
};

const EMPTY_PROMETHEUS: API.AgentRuntimePrometheusStatus = {
  enabled: false,
  healthy: false,
  tool_count: 0,
};

const normalizeRuntimeStatus = (
  value?: API.AgentRuntimeStatus,
): API.AgentRuntimeStatus | undefined =>
  value
    ? {
        ...value,
        concurrency: { ...EMPTY_CONCURRENCY, ...value.concurrency },
        features: { ...EMPTY_FEATURES, ...value.features },
        loop: { ...EMPTY_LOOP, ...value.loop },
        mcp_servers: value.mcp_servers || [],
        prometheus: { ...EMPTY_PROMETHEUS, ...value.prometheus },
        repositories: { ...EMPTY_REPOSITORIES, ...value.repositories },
        skills: { ...EMPTY_SKILLS, ...value.skills },
        tools: { ...EMPTY_TOOLS, ...value.tools },
      }
    : undefined;

const boolTag = (enabled?: boolean) => (
  <Tag color={enabled ? 'success' : 'default'}>{enabled ? '启用' : '停用'}</Tag>
);

const readyTag = (ready?: boolean) => (
  <Tag color={ready ? 'success' : 'default'}>{ready ? '就绪' : '未就绪'}</Tag>
);

const healthTag = (healthy?: boolean, enabled?: boolean) => {
  if (!enabled) {
    return <Tag>未启用</Tag>;
  }
  return (
    <Tag color={healthy ? 'success' : 'error'}>{healthy ? '健康' : '异常'}</Tag>
  );
};

const stateTag = (state?: string) => {
  const color =
    state === 'ready'
      ? 'success'
      : state === 'connecting'
        ? 'processing'
        : state === 'failed'
          ? 'error'
          : 'default';
  return <Tag color={color}>{state || '-'}</Tag>;
};

const formatTime = (value?: string) =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';

const getStoredClusterId = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.localStorage.getItem(CURRENT_CLUSTER_STORAGE_KEY) || undefined;
};

const getClusterName = (cluster?: API.ClusterItem) =>
  cluster?.alias ||
  cluster?.name ||
  (cluster?.id !== undefined ? String(cluster.id) : '');

const RuntimeStatus = () => {
  const { message } = App.useApp();
  const { styles } = useStyles();
  const [status, setStatus] = useState<API.AgentRuntimeStatus>();
  const [clusterContext, setClusterContext] = useState<{
    id?: string;
    label?: string;
  }>(() => {
    const clusterId = getStoredClusterId();
    return { id: clusterId, label: clusterId };
  });
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [rollbackVersion, setRollbackVersion] =
    useState<API.AgentRuntimeConfigVersion>();
  const runtimeStatus = normalizeRuntimeStatus(status);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAgentRuntimeStatus({ skipErrorHandler: true });
      setStatus(res.data);
    } catch (error) {
      message.error(getErrorMessage(error, '运行时状态加载失败'));
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    const handleClusterChange = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          cluster?: API.ClusterItem;
          clusterId?: string;
        }>
      ).detail;
      const clusterId = detail?.clusterId || getStoredClusterId();
      setClusterContext({
        id: clusterId,
        label: getClusterName(detail?.cluster) || clusterId,
      });
    };

    window.addEventListener(CURRENT_CLUSTER_CHANGE_EVENT, handleClusterChange);
    return () => {
      window.removeEventListener(
        CURRENT_CLUSTER_CHANGE_EVENT,
        handleClusterChange,
      );
    };
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [clusterContext.id, loadStatus]);

  const mcpColumns: ColumnsType<API.AgentRuntimeMCPServerStatus> = [
    { title: 'Server', dataIndex: 'name', width: 240, ellipsis: true },
    { title: 'Transport', dataIndex: 'transport', width: 120 },
    {
      title: '状态',
      dataIndex: 'state',
      width: 120,
      render: (_, record) => stateTag(record.state),
    },
    {
      title: '就绪',
      dataIndex: 'ready',
      width: 90,
      render: (_, record) => readyTag(record.ready),
    },
    {
      title: '工具',
      dataIndex: 'tool_count',
      width: 100,
      render: (_, record) =>
        `${record.trusted_tool_count} / ${record.tool_count}`,
    },
    {
      title: '并发',
      dataIndex: 'max_concurrency',
      width: 100,
      render: (_, record) => record.max_concurrency || '-',
    },
    {
      title: '调用超时',
      dataIndex: 'call_timeout_ms',
      width: 120,
      render: (_, record) => `${record.call_timeout_ms || 0} ms`,
    },
    {
      title: '健康间隔',
      dataIndex: 'health_interval_ms',
      width: 120,
      render: (_, record) => `${record.health_interval_ms || 0} ms`,
    },
  ];
  const comfortableMcpColumns = withComfortableTableColumns(mcpColumns);

  const handleRollback = (version: API.AgentRuntimeConfigVersion) => {
    setRollbackVersion(version);
  };

  const submitRollback = async (reason: string) => {
    if (!rollbackVersion) {
      return;
    }

    setRollingBack(true);
    try {
      await rollbackAgentRuntimeConfigVersion(
        rollbackVersion.id,
        { reason },
        { skipErrorHandler: true },
      );
      message.success('运行时配置已回滚');
      setRollbackVersion(undefined);
      setHistoryRefreshKey((value) => value + 1);
      await loadStatus();
    } catch (error) {
      message.error(getErrorMessage(error, '运行时配置回滚失败'));
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <PageContainer
      title="Agent 运行时状态"
      extra={
        <Space wrap>
          <Tag color={clusterContext.id ? 'blue' : 'default'}>
            集群 {clusterContext.label || clusterContext.id || '未选择'}
          </Tag>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setHistoryOpen(true)}
          >
            配置历史
          </Button>
          <Button
            icon={<ToolOutlined />}
            onClick={() => history.push('/ai/tool')}
          >
            工具治理
          </Button>
          <Button
            icon={<UserSwitchOutlined />}
            onClick={() => history.push('/ai/skill')}
          >
            技能治理
          </Button>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={loadStatus}
          >
            刷新
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading && !status}>
        {runtimeStatus ? (
          <div className={styles.body}>
            <div className={styles.grid}>
              <Card className={styles.card} size="small" title="能力开关">
                <div className={styles.tagWrap}>
                  <Tag color="blue">
                    Runtime #{runtimeStatus.runtime_version || 0}
                  </Tag>
                  {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                    <Tag
                      key={key}
                      color={
                        runtimeStatus.features[
                          key as keyof API.AgentRuntimeFeatureStatus
                        ]
                          ? 'success'
                          : 'default'
                      }
                    >
                      {label}
                    </Tag>
                  ))}
                </div>
              </Card>
              <Card className={styles.card} size="small" title="工具与技能">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Runtime 版本">
                    #{runtimeStatus.runtime_version || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="工具">
                    {runtimeStatus.tools.enabled} / {runtimeStatus.tools.total}{' '}
                    启用
                  </Descriptions.Item>
                  <Descriptions.Item label="MCP 工具">
                    {runtimeStatus.tools.mcp}
                  </Descriptions.Item>
                  <Descriptions.Item label="Prometheus 工具">
                    {runtimeStatus.tools.prometheus}
                  </Descriptions.Item>
                  <Descriptions.Item label="技能">
                    {runtimeStatus.skills.enabled} /{' '}
                    {runtimeStatus.skills.total} 启用
                  </Descriptions.Item>
                </Descriptions>
              </Card>
              <Card className={styles.card} size="small" title="并发控制">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="实例">
                    {runtimeStatus.concurrency.instance_id || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="用户并发">
                    {runtimeStatus.concurrency.max_concurrent_runs_per_user ||
                      '不限'}
                  </Descriptions.Item>
                  <Descriptions.Item label="全局并发">
                    {runtimeStatus.concurrency.max_concurrent_runs || '不限'}
                  </Descriptions.Item>
                  <Descriptions.Item label="分布式信号量">
                    {boolTag(runtimeStatus.concurrency.distributed_semaphore)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
            <Card className={styles.card} title="Loop 配置">
              <Descriptions bordered column={3} size="small">
                <Descriptions.Item label="最大步骤">
                  {runtimeStatus.loop.max_steps}
                </Descriptions.Item>
                <Descriptions.Item label="Token 预算">
                  {runtimeStatus.loop.max_token_budget || '不限'}
                </Descriptions.Item>
                <Descriptions.Item label="步骤超时">
                  {runtimeStatus.loop.step_timeout_ms} ms
                </Descriptions.Item>
                <Descriptions.Item label="反思补证">
                  {runtimeStatus.loop.max_reflection_steps}
                </Descriptions.Item>
                <Descriptions.Item label="最大反思">
                  {runtimeStatus.loop.max_reflections}
                </Descriptions.Item>
                <Descriptions.Item label="反思评委">
                  {runtimeStatus.loop.reflection_jurors}
                </Descriptions.Item>
                <Descriptions.Item label="案例 Few-shot">
                  {runtimeStatus.loop.case_few_shot_limit}
                </Descriptions.Item>
                <Descriptions.Item label="路由 Few-shot">
                  {runtimeStatus.loop.route_few_shot_limit}
                </Descriptions.Item>
                <Descriptions.Item label="案例缓存">
                  {runtimeStatus.loop.case_cache_size}
                </Descriptions.Item>
                <Descriptions.Item label="路由缓存">
                  {runtimeStatus.loop.route_cache_size}
                </Descriptions.Item>
                <Descriptions.Item label="工具错误上限">
                  {runtimeStatus.loop.max_tool_errors_per_step}
                </Descriptions.Item>
                <Descriptions.Item label="工具选择">
                  {runtimeStatus.loop.tool_choice || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="重规划间隔">
                  {runtimeStatus.loop.replan_interval || '关闭'}
                </Descriptions.Item>
                <Descriptions.Item label="最大重规划">
                  {runtimeStatus.loop.max_replans}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Card className={styles.card} title="依赖能力">
              <Space size={[0, 8]} wrap>
                {Object.entries(runtimeStatus.repositories).map(
                  ([key, enabled]) => (
                    <Tag key={key} color={enabled ? 'success' : 'default'}>
                      {key}: {enabled ? '可用' : '不可用'}
                    </Tag>
                  ),
                )}
              </Space>
            </Card>
            <Card className={styles.card} title="Prometheus">
              <Descriptions bordered column={3} size="small">
                <Descriptions.Item label="探测集群">
                  {clusterContext.label || clusterContext.id || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {boolTag(runtimeStatus.prometheus.enabled)}
                </Descriptions.Item>
                <Descriptions.Item label="健康">
                  {healthTag(
                    runtimeStatus.prometheus.healthy,
                    runtimeStatus.prometheus.enabled,
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="服务">
                  {runtimeStatus.prometheus.namespace || '-'}/
                  {runtimeStatus.prometheus.service || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="端口">
                  {runtimeStatus.prometheus.port || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="协议">
                  {runtimeStatus.prometheus.scheme || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="查询超时">
                  {runtimeStatus.prometheus.query_timeout_ms || 0} ms
                </Descriptions.Item>
                <Descriptions.Item label="工具数">
                  {runtimeStatus.prometheus.tool_count}
                </Descriptions.Item>
                <Descriptions.Item label="探测耗时">
                  {runtimeStatus.prometheus.latency_ms ?? 0} ms
                </Descriptions.Item>
                <Descriptions.Item label="最近探测">
                  {formatTime(runtimeStatus.prometheus.last_checked_at)}
                </Descriptions.Item>
                <Descriptions.Item label="错误">
                  {runtimeStatus.prometheus.last_error || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Card className={styles.card} title="MCP Server">
              <Table<API.AgentRuntimeMCPServerStatus>
                rowKey={(record) => `${record.name}-${record.transport}`}
                size="small"
                columns={comfortableMcpColumns}
                dataSource={runtimeStatus.mcp_servers}
                pagination={false}
                scroll={getComfortableTableScroll(comfortableMcpColumns, {
                  x: 1080,
                })}
              />
            </Card>
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无运行时状态"
          />
        )}
      </Spin>
      <RuntimeHistoryDrawer
        open={historyOpen}
        refreshKey={historyRefreshKey}
        rollingBack={rollingBack}
        onClose={() => setHistoryOpen(false)}
        onRollback={handleRollback}
      />
      <RuntimeChangeReasonModal
        danger
        confirmText="回滚"
        loading={rollingBack}
        open={Boolean(rollbackVersion)}
        title={
          rollbackVersion
            ? `回滚到版本 #${rollbackVersion.version}`
            : '回滚运行时配置'
        }
        onCancel={() => {
          if (!rollingBack) {
            setRollbackVersion(undefined);
          }
        }}
        onSubmit={submitRollback}
      />
    </PageContainer>
  );
};

export default RuntimeStatus;
