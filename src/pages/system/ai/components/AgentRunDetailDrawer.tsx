import { DislikeOutlined, LikeOutlined } from '@ant-design/icons';
import { Link } from '@umijs/max';
import {
  App,
  Button,
  Drawer,
  Empty,
  Input,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { submitAgentRunFeedback } from '@/services/kubeflare/agent';
import { getAgentTypeLabel } from '@/utils/agent';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import { getErrorMessage, prettyJson } from '../utils';
import JsonCodeBlock from './JsonCodeBlock';
import { AgentRunStatusTag, RouteSourceTag } from './RunTags';

const useStyles = createStyles(({ token }) => ({
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginMD,

    '@media (max-width: 860px)': {
      gridTemplateColumns: '1fr',
    },
  },
  summaryItem: {
    display: 'grid',
    gap: 4,
    minWidth: 0,
  },
  label: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
  value: {
    minWidth: 0,
    color: token.colorText,
    overflowWrap: 'anywhere',
  },
  section: {
    display: 'grid',
    gap: token.marginSM,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: token.marginXS,
  },
  feedbackActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: token.marginSM,
  },
  feedbackForm: {
    display: 'grid',
    gap: token.marginSM,
    maxWidth: 720,
  },
}));

type AgentRunDetailDrawerProps = {
  detail?: API.AgentRunDetail;
  loading?: boolean;
  open: boolean;
  onClose: () => void;
  onFeedbackSubmitted?: (feedback: API.AgentRunFeedback) => void;
};

const formatTime = (value?: string) =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';

const formatDuration = (durationMs?: number) => {
  if (!Number.isFinite(durationMs)) {
    return '-';
  }

  return durationMs && durationMs >= 1000
    ? `${(durationMs / 1000).toFixed(1)} 秒`
    : `${durationMs || 0} ms`;
};

const formatToolDuration = (startedAt?: string, completedAt?: string) => {
  if (!startedAt || !completedAt) {
    return '-';
  }

  const startedTime = dayjs(startedAt);
  const completedTime = dayjs(completedAt);
  if (!startedTime.isValid() || !completedTime.isValid()) {
    return '-';
  }

  const duration = completedTime.diff(startedTime);
  return duration >= 0 ? formatDuration(duration) : '-';
};

const SummaryItem = ({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) => {
  const { styles } = useStyles();

  return (
    <div className={styles.summaryItem}>
      <span className={styles.label}>{label}</span>
      <div className={styles.value}>{value ?? '-'}</div>
    </div>
  );
};

const renderText = (value?: string) =>
  value ? <Typography.Text>{value}</Typography.Text> : '-';

const formatBoolean = (value?: boolean) => (value ? '是' : '否');

const RESOURCE_KIND_MAP: Record<string, API.ClusterResourceCreateType> = {
  clusterrole: 'ClusterRole',
  clusterrolebinding: 'ClusterRoleBinding',
  configmap: 'ConfigMap',
  endpointslice: 'EndpointSlice',
  horizontalpodautoscaler: 'HorizontalPodAutoscaler',
  hpa: 'HorizontalPodAutoscaler',
  ingress: 'Ingress',
  ingressclass: 'IngressClass',
  networkpolicy: 'NetworkPolicy',
  persistentvolume: 'PersistentVolume',
  persistentvolumeclaim: 'PersistentVolumeClaim',
  pod: 'Pod',
  pvc: 'PersistentVolumeClaim',
  role: 'Role',
  rolebinding: 'RoleBinding',
  secret: 'Secret',
  service: 'Service',
  serviceaccount: 'ServiceAccount',
  storageclass: 'StorageClass',
};

const WORKLOAD_KIND_MAP: Record<string, API.ClusterWorkloadType> = {
  daemonset: 'DaemonSet',
  deployment: 'Deployment',
  statefulset: 'StatefulSet',
};

const LIST_EVIDENCE_NAMES = new Set([
  'describe-events',
  'event-list',
  'events',
  'node-list',
  'pod-list',
  'workload-list',
  'workload-pod-list',
]);

const getEvidenceResourcePath = (record: API.AgentEvidence) => {
  const resourceKind = record.resource_kind?.toLowerCase();
  const sourceKind = record.source_kind?.toLowerCase();
  const name = record.name;
  if (!name) {
    return undefined;
  }

  if (resourceKind === 'event' || sourceKind?.includes('event')) {
    return '/cluster/events';
  }

  if (LIST_EVIDENCE_NAMES.has(name.toLowerCase())) {
    return undefined;
  }

  const kind =
    resourceKind ||
    (sourceKind?.replace(/[_-]/g, '').includes('podlog')
      ? 'podlog'
      : undefined);
  if (!kind) {
    return undefined;
  }

  if (kind === 'node') {
    return `/cluster/node/detail/${encodeURIComponent(name)}`;
  }

  if (kind === 'podlog' && record.namespace) {
    return `/cluster/resource/detail/${encodeURIComponent(
      'Pod',
    )}/${encodeURIComponent(record.namespace)}/${encodeURIComponent(name)}`;
  }

  const workloadType = WORKLOAD_KIND_MAP[kind];
  if (workloadType && record.namespace) {
    return `/cluster/workloads/detail/${encodeURIComponent(
      workloadType,
    )}/${encodeURIComponent(record.namespace)}/${encodeURIComponent(name)}`;
  }

  const resourceType = RESOURCE_KIND_MAP[kind];
  if (!resourceType) {
    return undefined;
  }

  return `/cluster/resource/detail/${encodeURIComponent(
    resourceType,
  )}/${encodeURIComponent(record.namespace || '-')}/${encodeURIComponent(
    name,
  )}`;
};

const AgentRunDetailDrawer = ({
  detail,
  loading = false,
  open,
  onClose,
  onFeedbackSubmitted,
}: AgentRunDetailDrawerProps) => {
  const { message } = App.useApp();
  const { styles } = useStyles();
  const run = detail?.run;
  const toolCalls = detail?.tool_calls || [];
  const evidences = detail?.evidences || [];
  const canSubmitFeedback =
    run?.status === 'completed' || run?.status === 'failed';
  const [feedback, setFeedback] = useState<API.AgentRunFeedback>();
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<
    boolean | undefined
  >();

  useEffect(() => {
    setFeedback(detail?.feedback);
    setFeedbackComment(detail?.feedback?.comment || '');
    setFeedbackSubmitting(undefined);
  }, [detail?.feedback, detail?.run.id]);

  const handleSubmitFeedback = async (useful: boolean) => {
    if (!run?.id || !canSubmitFeedback || feedbackSubmitting !== undefined) {
      return;
    }

    setFeedbackSubmitting(useful);
    try {
      const res = await submitAgentRunFeedback(
        run.id,
        {
          comment: feedbackComment.trim() || undefined,
          useful,
        },
        { skipErrorHandler: true },
      );
      if (res.data) {
        setFeedback(res.data);
        setFeedbackComment(res.data.comment || '');
        onFeedbackSubmitted?.(res.data);
      }
      message.success('Run 反馈已保存');
    } catch (error) {
      message.error(getErrorMessage(error, 'Run 反馈保存失败'));
    } finally {
      setFeedbackSubmitting(undefined);
    }
  };

  const toolColumns: ColumnsType<API.AgentToolCall> = [
    {
      title: '工具',
      dataIndex: 'tool_id',
      width: 240,
      ellipsis: true,
      render: (_, record) => (
        <Typography.Text copyable>{record.tool_id}</Typography.Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) => <AgentRunStatusTag status={record.status} />,
    },
    {
      title: '摘要',
      dataIndex: 'output_summary',
      width: 300,
      ellipsis: true,
      render: (_, record) => record.output_summary || '-',
    },
    {
      title: '错误',
      dataIndex: 'error_message',
      width: 260,
      ellipsis: true,
      render: (_, record) => record.error_message || '-',
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      width: 170,
      render: (_, record) => formatTime(record.started_at),
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      width: 170,
      render: (_, record) => formatTime(record.completed_at),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      width: 110,
      render: (_, record) =>
        formatToolDuration(record.started_at, record.completed_at),
    },
  ];

  const evidenceColumns: ColumnsType<API.AgentEvidence> = [
    {
      title: '资源',
      dataIndex: 'name',
      width: 240,
      ellipsis: true,
      render: (_, record) => {
        const resourcePath = getEvidenceResourcePath(record);

        return (
          <Space direction="vertical" size={0}>
            {resourcePath ? (
              <Link to={resourcePath}>{record.name || '-'}</Link>
            ) : (
              <Typography.Text>{record.name || '-'}</Typography.Text>
            )}
            <Typography.Text type="secondary">
              {record.resource_kind || record.source_kind || '-'}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      width: 140,
      ellipsis: true,
      render: (_, record) => record.namespace || '-',
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      width: 300,
      ellipsis: true,
      render: (_, record) => record.summary || '-',
    },
    {
      title: '采集时间',
      dataIndex: 'collected_at',
      width: 170,
      render: (_, record) => formatTime(record.collected_at),
    },
  ];
  const comfortableToolColumns = withComfortableTableColumns(toolColumns);
  const comfortableEvidenceColumns =
    withComfortableTableColumns(evidenceColumns);

  return (
    <Drawer
      destroyOnHidden
      loading={loading}
      open={open}
      title={run ? `Run 详情 / ${run.id}` : 'Run 详情'}
      width="76vw"
      onClose={onClose}
    >
      {run ? (
        <Tabs
          items={[
            {
              key: 'overview',
              label: '概览',
              children: (
                <div className={styles.section}>
                  <div className={styles.summary}>
                    <SummaryItem
                      label="Agent"
                      value={getAgentTypeLabel(run.agent_type)}
                    />
                    <SummaryItem
                      label="状态"
                      value={<AgentRunStatusTag status={run.status} />}
                    />
                    <SummaryItem
                      label="集群"
                      value={renderText(run.cluster_id)}
                    />
                    <SummaryItem
                      label="路由来源"
                      value={<RouteSourceTag value={run.route_source} />}
                    />
                    <SummaryItem
                      label="路由理由"
                      value={renderText(run.route_reason)}
                    />
                    <SummaryItem
                      label="置信度"
                      value={`${Math.round((run.confidence || 0) * 100)}%`}
                    />
                    <SummaryItem label="用户" value={renderText(run.user_id)} />
                    <SummaryItem
                      label="创建时间"
                      value={formatTime(run.created_at)}
                    />
                    <SummaryItem
                      label="完成时间"
                      value={formatTime(run.completed_at)}
                    />
                    <SummaryItem
                      label="心跳时间"
                      value={formatTime(run.heartbeat_at)}
                    />
                    <SummaryItem
                      label="租约持有者"
                      value={renderText(run.lease_owner)}
                    />
                    <SummaryItem
                      label="租约过期"
                      value={formatTime(run.lease_expires)}
                    />
                  </div>
                  <SummaryItem label="输入" value={renderText(run.input)} />
                  <SummaryItem label="摘要" value={renderText(run.summary)} />
                  <SummaryItem
                    label="错误"
                    value={renderText(run.error_message)}
                  />
                  <SummaryItem
                    label="Scope"
                    value={<JsonCodeBlock value={prettyJson(run.scope)} />}
                  />
                  {detail.metrics ? (
                    <div className={styles.tags}>
                      <Tag>步骤 {detail.metrics.step_count}</Tag>
                      <Tag>工具 {detail.metrics.tool_call_count}</Tag>
                      <Tag>
                        Token{' '}
                        {detail.metrics.token_used +
                          detail.metrics.extra_token_used}
                      </Tag>
                      <Tag>
                        耗时 {formatDuration(detail.metrics.duration_ms)}
                      </Tag>
                      <Tag>反思 {detail.metrics.reflection_count}</Tag>
                      <Tag>重规划 {detail.metrics.replan_count}</Tag>
                      <Tag>
                        计划 {formatBoolean(detail.metrics.plan_generated)}
                      </Tag>
                      <Tag>反思陪审 {detail.metrics.reflection_jurors}</Tag>
                      <Tag>
                        Playbook{' '}
                        {formatBoolean(detail.metrics.playbook_matched)}
                      </Tag>
                      <Tag>
                        假设 {detail.metrics.hypothesis_resolved}/
                        {detail.metrics.hypothesis_total}
                      </Tag>
                      <Tag>案例命中 {detail.metrics.case_hit_count}</Tag>
                      <Tag>
                        案例检索 {detail.metrics.case_retrieval_mode || '-'}
                      </Tag>
                      <Tag
                        color={
                          detail.metrics.token_estimated ? 'warning' : 'success'
                        }
                      >
                        Token {detail.metrics.token_estimated ? '估算' : '精确'}
                      </Tag>
                    </div>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'tool',
              label: `工具调用 ${toolCalls.length}`,
              children: (
                <Table<API.AgentToolCall>
                  rowKey="id"
                  size="small"
                  columns={comfortableToolColumns}
                  dataSource={toolCalls}
                  pagination={false}
                  scroll={getComfortableTableScroll(comfortableToolColumns, {
                    x: 900,
                  })}
                  expandable={{
                    expandedRowRender: (record) => (
                      <JsonCodeBlock value={prettyJson(record.input)} />
                    ),
                  }}
                />
              ),
            },
            {
              key: 'evidence',
              label: `证据 ${evidences.length}`,
              children: (
                <Table<API.AgentEvidence>
                  rowKey="id"
                  size="small"
                  columns={comfortableEvidenceColumns}
                  dataSource={evidences}
                  pagination={false}
                  scroll={getComfortableTableScroll(
                    comfortableEvidenceColumns,
                    { x: 900 },
                  )}
                  expandable={{
                    expandedRowRender: (record) => (
                      <JsonCodeBlock value={prettyJson(record.raw_json)} />
                    ),
                  }}
                />
              ),
            },
            {
              key: 'feedback',
              label: '反馈',
              children: (
                <div className={styles.section}>
                  {feedback ? (
                    <>
                      <div className={styles.tags}>
                        <Tag color={feedback.useful ? 'success' : 'error'}>
                          {feedback.useful ? '有用' : '需改进'}
                        </Tag>
                        <Tag>更新于 {formatTime(feedback.updated_at)}</Tag>
                      </div>
                      <SummaryItem
                        label="备注"
                        value={renderText(feedback.comment)}
                      />
                    </>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无反馈"
                    />
                  )}
                  <div className={styles.feedbackForm}>
                    <Input.TextArea
                      autoSize={{ minRows: 3, maxRows: 6 }}
                      maxLength={1024}
                      placeholder="可补充证据是否充分、判断是否准确、建议是否可执行"
                      showCount
                      disabled={!canSubmitFeedback}
                      value={feedbackComment}
                      onChange={(event) =>
                        setFeedbackComment(event.target.value)
                      }
                    />
                    <div className={styles.feedbackActions}>
                      <Button
                        disabled={
                          !canSubmitFeedback || feedbackSubmitting !== undefined
                        }
                        icon={<LikeOutlined />}
                        loading={feedbackSubmitting === true}
                        type={feedback?.useful ? 'primary' : 'default'}
                        onClick={() => handleSubmitFeedback(true)}
                      >
                        标记有用
                      </Button>
                      <Button
                        danger
                        disabled={
                          !canSubmitFeedback || feedbackSubmitting !== undefined
                        }
                        icon={<DislikeOutlined />}
                        loading={feedbackSubmitting === false}
                        type={
                          feedback?.useful === false ? 'primary' : 'default'
                        }
                        onClick={() => handleSubmitFeedback(false)}
                      >
                        标记需改进
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Drawer>
  );
};

export default AgentRunDetailDrawer;
