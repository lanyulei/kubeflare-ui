import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { TableColumnsType } from 'antd';
import {
  App,
  Button,
  Card,
  Drawer,
  Empty,
  Radio,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAgentOptions } from '@/hooks/useAgentOptions';
import { useClusterOptions } from '@/hooks/useClusterOptions';
import {
  getAgentRunDetail,
  getAgentRunMetricsEvaluation,
  getAgentRunMetricsSamples,
} from '@/services/kubeflare/agent';
import { getAgentTypeLabel } from '@/utils/agent';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import AgentRunDetailDrawer from '../components/AgentRunDetailDrawer';
import { AgentRunStatusTag } from '../components/RunTags';
import { getErrorMessage } from '../utils';
import {
  type AgentEvaluationFeatureItem,
  clampPercent,
  EMPTY_AGENT_FEATURE_BUCKET,
  EVALUATION_WINDOW_OPTIONS,
  FEATURE_COMPARISON_ITEMS,
  formatAverage,
  formatCount,
  formatDuration,
  formatPercent,
  formatPercentDelta,
  formatSince,
  getFeedbackRate,
  getUsefulRate,
  hasFeedback,
  safeNumber,
} from './helpers';
import { useStyles } from './styles';

type FeatureMetricRow = AgentEvaluationFeatureItem & {
  comparison: API.AgentFeatureComparison;
};

type SampleDrawerState = {
  enabled?: boolean;
  feature: AgentEvaluationFeatureItem;
};

type SummaryMetricProps = {
  footer?: string;
  tag?: string;
  title: string;
  value: string;
};

const getBucket = (bucket?: API.AgentFeatureBucket) =>
  bucket || EMPTY_AGENT_FEATURE_BUCKET;

const getComparison = (
  evaluation: API.AgentRunMetricsEvaluation | undefined,
  key: AgentEvaluationFeatureItem['key'],
): API.AgentFeatureComparison => ({
  off: getBucket(evaluation?.[key]?.off),
  on: getBucket(evaluation?.[key]?.on),
});

const getDeltaTagColor = (value: number) => {
  if (value > 0) {
    return 'success';
  }
  if (value < 0) {
    return 'error';
  }
  return 'default';
};

const SummaryMetric = ({ footer, tag, title, value }: SummaryMetricProps) => {
  const { styles } = useStyles();

  return (
    <Card className={styles.metricCard} size="small">
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel}>{title}</span>
        {tag ? <Tag>{tag}</Tag> : null}
      </div>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricFooter}>{footer || '-'}</div>
    </Card>
  );
};

const BucketStats = ({ bucket }: { bucket: API.AgentFeatureBucket }) => {
  const { styles } = useStyles();

  if (safeNumber(bucket.run_count) <= 0) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }

  return (
    <div className={styles.bucketStats}>
      <Tag>Run {formatCount(bucket.run_count)}</Tag>
      <Tag>反馈 {formatCount(bucket.feedback_count)}</Tag>
      <Tag color="green">有用 {formatCount(bucket.useful_count)}</Tag>
    </div>
  );
};

const RateCompareCell = ({
  comparison,
}: {
  comparison: API.AgentFeatureComparison;
}) => {
  const { styles, cx } = useStyles();
  const onRate = getUsefulRate(comparison.on);
  const offRate = getUsefulRate(comparison.off);
  const onHasFeedback = hasFeedback(comparison.on);
  const offHasFeedback = hasFeedback(comparison.off);
  const usefulDelta = onRate - offRate;

  return (
    <div className={styles.rateCell}>
      <div className={styles.rateLine}>
        <span>开启</span>
        <span className={styles.rateTrack}>
          <span
            className={styles.rateBar}
            style={{ width: `${clampPercent(onRate * 100)}%` }}
          />
        </span>
        <Typography.Text strong>
          {onHasFeedback ? formatPercent(onRate) : '无反馈'}
        </Typography.Text>
      </div>
      <div className={styles.rateLine}>
        <span>关闭</span>
        <span className={styles.rateTrack}>
          <span
            className={cx(styles.rateBar, styles.rateBarMuted)}
            style={{ width: `${clampPercent(offRate * 100)}%` }}
          />
        </span>
        <Typography.Text strong>
          {offHasFeedback ? formatPercent(offRate) : '无反馈'}
        </Typography.Text>
      </div>
      <div className={styles.deltaRow}>
        <span>差值</span>
        {onHasFeedback && offHasFeedback ? (
          <Tag color={getDeltaTagColor(usefulDelta)}>
            {formatPercentDelta(usefulDelta)}
          </Tag>
        ) : (
          <Typography.Text type="secondary">样本不足</Typography.Text>
        )}
      </div>
    </div>
  );
};

const CostCompareCell = ({
  comparison,
}: {
  comparison: API.AgentFeatureComparison;
}) => {
  const { styles } = useStyles();
  const rows = [
    {
      label: 'Token',
      off: formatAverage(comparison.off.avg_token_total),
      on: formatAverage(comparison.on.avg_token_total),
    },
    {
      label: '工具',
      off: formatAverage(comparison.off.avg_tool_call_count),
      on: formatAverage(comparison.on.avg_tool_call_count),
    },
    {
      label: '耗时',
      off: formatDuration(comparison.off.avg_duration_ms),
      on: formatDuration(comparison.on.avg_duration_ms),
    },
  ];

  return (
    <div className={styles.costStack}>
      {rows.map((row) => (
        <div className={styles.costLine} key={row.label}>
          <span className={styles.costLabel}>{row.label}</span>
          <Typography.Text ellipsis>开 {row.on}</Typography.Text>
          <Typography.Text ellipsis>关 {row.off}</Typography.Text>
        </div>
      ))}
    </div>
  );
};

const AgentEvaluation = () => {
  const { message } = App.useApp();
  const { styles } = useStyles();
  const mountedRef = useRef(true);
  const requestRef = useRef(0);
  const { loading: agentOptionsLoading, options: agentOptions } =
    useAgentOptions();
  const { loading: clusterLoading, options: clusterOptions } =
    useClusterOptions();
  const [days, setDays] = useState(30);
  const [agentType, setAgentType] = useState<API.AgentType>();
  const [clusterID, setClusterID] = useState('');
  const [evaluation, setEvaluation] = useState<API.AgentRunMetricsEvaluation>();
  const [loading, setLoading] = useState(false);
  const [sampleDrawer, setSampleDrawer] = useState<SampleDrawerState>();
  const [sampleReloadKey, setSampleReloadKey] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<API.AgentRunDetail>();

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  const loadEvaluation = useCallback(
    async (
      nextDays: number,
      nextAgentType?: API.AgentType,
      nextClusterID = '',
    ) => {
      const requestId = ++requestRef.current;
      setLoading(true);

      try {
        const res = await getAgentRunMetricsEvaluation(
          {
            agent_type: nextAgentType,
            cluster_id: nextClusterID.trim() || undefined,
            days: nextDays,
          },
          { skipErrorHandler: true },
        );
        if (!mountedRef.current || requestId !== requestRef.current) {
          return;
        }
        setEvaluation(res.data);
      } catch (error) {
        if (mountedRef.current && requestId === requestRef.current) {
          message.error(getErrorMessage(error, 'Agent 评估数据加载失败'));
        }
      } finally {
        if (mountedRef.current && requestId === requestRef.current) {
          setLoading(false);
        }
      }
    },
    [message],
  );

  useEffect(() => {
    void loadEvaluation(days, agentType, clusterID);
  }, [agentType, clusterID, days, loadEvaluation]);

  const overall = getBucket(evaluation?.overall);
  const featureRows = useMemo<FeatureMetricRow[]>(
    () =>
      FEATURE_COMPARISON_ITEMS.map((item) => ({
        ...item,
        comparison: getComparison(evaluation, item.key),
      })),
    [evaluation],
  );
  const windowDays = evaluation?.window_days || days;

  const openRunDetail = async (runID: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(undefined);
    try {
      const res = await getAgentRunDetail(runID, { skipErrorHandler: true });
      setDetail(res.data);
    } catch (error) {
      message.error(getErrorMessage(error, 'Run 详情加载失败'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFeedbackSubmitted = (feedback: API.AgentRunFeedback) => {
    setDetail((current) =>
      current?.run.id === feedback.run_id
        ? {
            ...current,
            feedback,
          }
        : current,
    );
    setSampleReloadKey((key) => key + 1);
    void loadEvaluation(days, agentType, clusterID);
  };

  const columns: TableColumnsType<FeatureMetricRow> = [
    {
      title: '评估特性',
      dataIndex: 'title',
      width: 220,
      render: (_, record) => (
        <div className={styles.featureCell}>
          <span className={styles.featureTitle}>{record.title}</span>
          <span className={styles.featureDescription}>
            {record.description}
          </span>
        </div>
      ),
    },
    {
      title: '开启样本',
      dataIndex: ['comparison', 'on'],
      width: 190,
      render: (_, record) => <BucketStats bucket={record.comparison.on} />,
    },
    {
      title: '关闭样本',
      dataIndex: ['comparison', 'off'],
      width: 190,
      render: (_, record) => <BucketStats bucket={record.comparison.off} />,
    },
    {
      title: '有用率对比',
      dataIndex: 'comparison',
      width: 290,
      render: (_, record) => <RateCompareCell comparison={record.comparison} />,
    },
    {
      title: '平均成本',
      dataIndex: 'cost',
      width: 260,
      render: (_, record) => <CostCompareCell comparison={record.comparison} />,
    },
    {
      title: '样本',
      dataIndex: 'sample',
      width: 150,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            onClick={() => setSampleDrawer({ enabled: true, feature: record })}
          >
            开启
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => setSampleDrawer({ enabled: false, feature: record })}
          >
            关闭
          </Button>
        </Space>
      ),
    },
  ];

  const sampleColumns: ProColumns<API.AgentRunMetricsSample>[] = [
    {
      title: 'Run',
      dataIndex: ['run', 'id'],
      width: 230,
      ellipsis: true,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <a onClick={() => openRunDetail(record.run.id)}>{record.run.id}</a>
          <Typography.Text type="secondary" ellipsis>
            {record.run.input || '-'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Agent',
      dataIndex: ['run', 'agent_type'],
      width: 130,
      search: false,
      render: (_, record) => getAgentTypeLabel(record.run.agent_type),
    },
    {
      title: '状态',
      dataIndex: ['run', 'status'],
      width: 110,
      search: false,
      render: (_, record) => <AgentRunStatusTag status={record.run.status} />,
    },
    {
      title: '反馈',
      dataIndex: ['feedback', 'useful'],
      width: 100,
      search: false,
      render: (_, record) =>
        record.feedback ? (
          <Tag color={record.feedback.useful ? 'success' : 'error'}>
            {record.feedback.useful ? '有用' : '没用'}
          </Tag>
        ) : (
          <Typography.Text type="secondary">无反馈</Typography.Text>
        ),
    },
    {
      title: '成本',
      dataIndex: 'metrics',
      width: 320,
      search: false,
      render: (_, record) => {
        const metrics = record.metrics;

        return (
          <Space size={[0, 6]} wrap>
            <Tag>步骤 {metrics?.step_count ?? '-'}</Tag>
            <Tag>工具 {metrics?.tool_call_count ?? '-'}</Tag>
            <Tag>
              Token{' '}
              {(metrics?.token_used || 0) + (metrics?.extra_token_used || 0)}
            </Tag>
            <Tag>耗时 {formatDuration(metrics?.duration_ms)}</Tag>
            {metrics?.token_estimated ? (
              <Tag color="warning">估算 Token</Tag>
            ) : null}
            {metrics?.plan_generated ? <Tag color="blue">计划</Tag> : null}
            {metrics?.playbook_matched ? (
              <Tag color="purple">Playbook</Tag>
            ) : null}
            {metrics?.hypothesis_total ? (
              <Tag>
                假设 {metrics.hypothesis_resolved}/{metrics.hypothesis_total}
              </Tag>
            ) : null}
            {metrics?.case_retrieval_mode ? (
              <Tag>检索 {metrics.case_retrieval_mode}</Tag>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: ['run', 'created_at'],
      width: 180,
      search: false,
      render: (_, record) => formatSince(record.run.created_at),
    },
    {
      title: '操作',
      dataIndex: 'option',
      width: 90,
      search: false,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openRunDetail(record.run.id)}
        >
          详情
        </Button>
      ),
    },
  ];
  const comfortableColumns = withComfortableTableColumns(columns);
  const comfortableSampleColumns = withComfortableTableColumns(sampleColumns);

  return (
    <PageContainer
      title="Agent 评估看板"
      extra={
        <Space wrap>
          <Select<API.AgentType>
            allowClear
            loading={agentOptionsLoading}
            options={agentOptions}
            placeholder="Agent"
            style={{ width: 180 }}
            value={agentType}
            onChange={setAgentType}
          />
          <Select<string>
            allowClear
            showSearch
            loading={clusterLoading}
            optionFilterProp="label"
            options={clusterOptions}
            placeholder="集群"
            style={{ width: 220 }}
            value={clusterID || undefined}
            onChange={(value) => setClusterID(value || '')}
          />
          <Radio.Group
            buttonStyle="solid"
            optionType="button"
            options={EVALUATION_WINDOW_OPTIONS}
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => loadEvaluation(days, agentType, clusterID)}
          >
            刷新
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading && !evaluation}>
        {evaluation ? (
          <div className={styles.pageBody}>
            <div className={styles.summaryGrid}>
              <SummaryMetric
                title="总完成 Run"
                tag={`${windowDays} 天`}
                value={formatCount(overall.run_count)}
                footer={`窗口自 ${formatSince(evaluation.since)} 起`}
              />
              <SummaryMetric
                title="反馈覆盖"
                value={
                  safeNumber(overall.run_count) > 0
                    ? formatPercent(getFeedbackRate(overall))
                    : '暂无样本'
                }
                footer={`反馈 ${formatCount(
                  overall.feedback_count,
                )} / Run ${formatCount(overall.run_count)}`}
              />
              <SummaryMetric
                title="有用率"
                value={
                  hasFeedback(overall)
                    ? formatPercent(getUsefulRate(overall))
                    : '暂无反馈'
                }
                footer={`有用 ${formatCount(
                  overall.useful_count,
                )} / 反馈 ${formatCount(overall.feedback_count)}`}
              />
              <SummaryMetric
                title="平均 Token"
                value={formatAverage(overall.avg_token_total)}
                footer="按完成 Run 聚合"
              />
              <SummaryMetric
                title="平均耗时"
                value={formatDuration(overall.avg_duration_ms)}
                footer="从运行创建到完成"
              />
              <SummaryMetric
                title="平均工具调用"
                value={formatAverage(overall.avg_tool_call_count)}
                footer={`平均步骤 ${formatAverage(overall.avg_step_count)}`}
              />
            </div>
            <Card
              className={styles.panelCard}
              title="能力开关效果对比"
              extra={
                <span className={styles.panelExtra}>
                  开启 / 关闭样本按同一时间窗口聚合
                </span>
              }
            >
              <Table<FeatureMetricRow>
                rowKey="key"
                columns={comfortableColumns}
                dataSource={featureRows}
                loading={loading}
                pagination={false}
                scroll={getComfortableTableScroll(comfortableColumns, {
                  x: 1150,
                })}
              />
            </Card>
          </div>
        ) : (
          <div className={styles.emptyPanel}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无 Agent 评估数据"
            />
          </div>
        )}
      </Spin>
      {sampleDrawer ? (
        <SampleDrawer
          columns={comfortableSampleColumns}
          agentType={agentType}
          clusterID={clusterID}
          days={days}
          enabled={sampleDrawer.enabled}
          feature={sampleDrawer.feature.key}
          reloadKey={sampleReloadKey}
          title={`${sampleDrawer.feature.title} / ${
            sampleDrawer.enabled ? '开启' : '关闭'
          }样本`}
          open={Boolean(sampleDrawer)}
          onClose={() => setSampleDrawer(undefined)}
        />
      ) : null}
      <AgentRunDetailDrawer
        detail={detail}
        loading={detailLoading}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    </PageContainer>
  );
};

const SampleDrawer = ({
  columns,
  agentType,
  clusterID,
  days,
  enabled,
  feature,
  reloadKey,
  onClose,
  open,
  title,
}: {
  columns: ProColumns<API.AgentRunMetricsSample>[];
  agentType?: API.AgentType;
  clusterID?: string;
  days: number;
  enabled?: boolean;
  feature: string;
  reloadKey: number;
  onClose: () => void;
  open: boolean;
  title: string;
}) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    actionRef.current?.reload();
  }, [reloadKey]);

  return (
    <Drawer
      destroyOnHidden
      open={open}
      title={title}
      width="76vw"
      onClose={onClose}
    >
      <ProTable<API.AgentRunMetricsSample, API.AgentRunMetricsSampleParams>
        rowKey={(record) => record.run.id}
        actionRef={actionRef}
        columns={columns}
        options={false}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        search={false}
        scroll={getComfortableTableScroll(columns, { x: 1180 })}
        request={async (params) => {
          try {
            const res = await getAgentRunMetricsSamples(
              {
                ...params,
                agent_type: agentType,
                cluster_id: clusterID?.trim() || undefined,
                days,
                enabled,
                feature,
              },
              { skipErrorHandler: true },
            );
            return {
              data: res.data.items || [],
              success: true,
              total: res.data.total || 0,
            };
          } catch (error) {
            message.error(getErrorMessage(error, '评估样本加载失败'));
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
      />
    </Drawer>
  );
};

export default AgentEvaluation;
