import { EyeOutlined, StopOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAgentOptions } from '@/hooks/useAgentOptions';
import { useClusterOptions } from '@/hooks/useClusterOptions';
import {
  cancelAgentRun,
  getAgentRunDetail,
  getAgentRunList,
} from '@/services/kubeflare/agent';
import { getAgentTypeLabel } from '@/utils/agent';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import AgentRunDetailDrawer from '../components/AgentRunDetailDrawer';
import { AgentRunStatusTag, RouteSourceTag } from '../components/RunTags';
import { getErrorMessage } from '../utils';

const RUN_STATUS_OPTIONS = [
  { label: '等待中', value: 'pending' },
  { label: '运行中', value: 'running' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
  { label: '已取消', value: 'cancelled' },
];

const RUN_WINDOW_OPTIONS = [
  { label: '最近 7 天', value: 7 },
  { label: '最近 30 天', value: 30 },
  { label: '最近 90 天', value: 90 },
  { label: '最近 180 天', value: 180 },
  { label: '最近 365 天', value: 365 },
];

const getInitialRunID = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return new URLSearchParams(window.location.search).get('run_id') || undefined;
};

const AgentRuns = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const initialRunIDRef = useRef(getInitialRunID());
  const { loading: agentOptionsLoading, options: agentOptions } =
    useAgentOptions();
  const { loading: clusterOptionsLoading, options: clusterOptions } =
    useClusterOptions();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<API.AgentRunDetail>();
  const [cancelingRunID, setCancelingRunID] = useState<string>();

  const openDetail = useCallback(
    async (runID: string) => {
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
    },
    [message],
  );

  useEffect(() => {
    if (initialRunIDRef.current) {
      void openDetail(initialRunIDRef.current);
    }
  }, [openDetail]);

  const handleFeedbackSubmitted = (feedback: API.AgentRunFeedback) => {
    setDetail((current) =>
      current?.run.id === feedback.run_id
        ? {
            ...current,
            feedback,
          }
        : current,
    );
  };

  const handleCancelRun = async (runID: string) => {
    setCancelingRunID(runID);
    try {
      await cancelAgentRun(runID, { skipErrorHandler: true });
      message.success('Run 已取消');
      actionRef.current?.reload();
      if (detail?.run.id === runID) {
        const res = await getAgentRunDetail(runID, { skipErrorHandler: true });
        setDetail(res.data);
      }
    } catch (error) {
      message.error(getErrorMessage(error, 'Run 取消失败'));
    } finally {
      setCancelingRunID(undefined);
    }
  };

  const columns: ProColumns<API.AgentRun>[] = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: '搜索 Run ID / 输入 / 摘要 / 错误',
      },
    },
    {
      title: '用户 ID',
      dataIndex: 'user_id',
      hideInTable: true,
      fieldProps: {
        placeholder: '按用户 ID 过滤',
      },
    },
    {
      title: '时间窗口',
      dataIndex: 'days',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        options: RUN_WINDOW_OPTIONS,
      },
    },
    {
      title: 'Run',
      dataIndex: 'id',
      width: 240,
      ellipsis: true,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <a onClick={() => openDetail(record.id)}>{record.id}</a>
          <Typography.Text type="secondary" ellipsis>
            {record.input || '-'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Agent',
      dataIndex: 'agent_type',
      width: 150,
      valueType: 'select',
      fieldProps: {
        loading: agentOptionsLoading,
        options: agentOptions,
      },
      renderText: (_, record) => getAgentTypeLabel(record.agent_type),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      valueType: 'select',
      fieldProps: {
        options: RUN_STATUS_OPTIONS,
      },
      render: (_, record) => <AgentRunStatusTag status={record.status} />,
    },
    {
      title: '路由来源',
      dataIndex: 'route_source',
      width: 120,
      search: false,
      render: (_, record) => <RouteSourceTag value={record.route_source} />,
    },
    {
      title: '集群',
      dataIndex: 'cluster_id',
      width: 180,
      ellipsis: true,
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        loading: clusterOptionsLoading,
        optionFilterProp: 'label',
        options: clusterOptions,
        placeholder: '选择集群',
        showSearch: true,
      },
      renderText: (_, record) => record.cluster_id || '-',
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      width: 100,
      search: false,
      renderText: (_, record) =>
        `${Math.round((record.confidence || 0) * 100)}%`,
    },
    {
      title: '错误',
      dataIndex: 'error_message',
      ellipsis: true,
      search: false,
      renderText: (_, record) => record.error_message || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      width: 180,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="detail"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openDetail(record.id)}
        >
          详情
        </Button>,
        record.status === 'pending' || record.status === 'running' ? (
          <Popconfirm
            key="cancel"
            title="确认取消该 Run 吗？"
            okText="取消 Run"
            cancelText="关闭"
            okButtonProps={{
              danger: true,
              loading: cancelingRunID === record.id,
            }}
            onConfirm={() => handleCancelRun(record.id)}
          >
            <Button
              danger
              type="link"
              size="small"
              icon={<StopOutlined />}
              loading={cancelingRunID === record.id}
            >
              取消
            </Button>
          </Popconfirm>
        ) : null,
      ],
    },
  ];
  const tableColumns = withComfortableTableColumns(columns);
  const tableScroll = getComfortableTableScroll(tableColumns, { x: 1280 });

  return (
    <PageContainer title="Agent Run 运维">
      <ProTable<API.AgentRun, API.AgentRunListParams>
        rowKey="id"
        actionRef={actionRef}
        columns={tableColumns}
        scroll={tableScroll}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
        search={{
          labelWidth: 90,
        }}
        form={{
          initialValues: initialRunIDRef.current
            ? { keyword: initialRunIDRef.current }
            : undefined,
        }}
        request={async (params) => {
          const res = await getAgentRunList(params, { skipErrorHandler: true });
          return {
            data: res.data.items || [],
            success: true,
            total: res.data.total || 0,
          };
        }}
      />
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

export default AgentRuns;
