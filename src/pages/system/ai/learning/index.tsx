import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Popconfirm,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useRef, useState } from 'react';
import { useAgentOptions } from '@/hooks/useAgentOptions';
import { useClusterOptions } from '@/hooks/useClusterOptions';
import {
  deleteAgentDiagnosisCaseByRunID,
  deleteAgentRouteFeedback,
  getAgentDiagnosisCaseList,
  getAgentRouteFeedbackList,
  getAgentRunDetail,
} from '@/services/kubeflare/agent';
import { getAgentTypeLabel } from '@/utils/agent';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import AgentRunDetailDrawer from '../components/AgentRunDetailDrawer';
import { AgentTypeTag } from '../components/AgentTags';
import JsonCodeBlock from '../components/JsonCodeBlock';
import { getErrorMessage, prettyJson } from '../utils';

const MATCH_OPTIONS = [
  { label: '一致', value: true },
  { label: '不一致', value: false },
];

const renderTags = (values?: string[]) => {
  if (!values?.length) {
    return '-';
  }

  return (
    <Space size={[0, 6]} wrap>
      {values.map((value) => (
        <Tag key={value}>{value}</Tag>
      ))}
    </Space>
  );
};

const Learning = () => {
  const { message } = App.useApp();
  const caseActionRef = useRef<ActionType | null>(null);
  const routeActionRef = useRef<ActionType | null>(null);
  const { loading: agentOptionsLoading, options: agentOptions } =
    useAgentOptions();
  const { loading: clusterOptionsLoading, options: clusterOptions } =
    useClusterOptions();
  const [deletingRunID, setDeletingRunID] = useState<string>();
  const [deletingFeedbackID, setDeletingFeedbackID] = useState<string>();
  const [selectedCase, setSelectedCase] = useState<API.AgentDiagnosisCase>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<API.AgentRunDetail>();

  const handleDeleteCase = async (runID: string) => {
    setDeletingRunID(runID);
    try {
      await deleteAgentDiagnosisCaseByRunID(runID, {
        skipErrorHandler: true,
      });
      message.success('案例已下架');
      caseActionRef.current?.reload();
    } catch (error) {
      message.error(getErrorMessage(error, '案例下架失败'));
    } finally {
      setDeletingRunID(undefined);
    }
  };

  const handleDeleteRouteFeedback = async (feedbackID: string) => {
    setDeletingFeedbackID(feedbackID);
    try {
      await deleteAgentRouteFeedback(feedbackID, {
        skipErrorHandler: true,
      });
      message.success('路由样本已删除');
      routeActionRef.current?.reload();
    } catch (error) {
      message.error(getErrorMessage(error, '路由样本删除失败'));
    } finally {
      setDeletingFeedbackID(undefined);
    }
  };

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
    caseActionRef.current?.reload();
    routeActionRef.current?.reload();

    if (!feedback.useful && selectedCase?.run_id === feedback.run_id) {
      setSelectedCase(undefined);
    }
  };

  const caseColumns: ProColumns<API.AgentDiagnosisCase>[] = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: '搜索问题 / 症状 / 根因 / 标签',
      },
    },
    {
      title: '问题',
      dataIndex: 'question',
      ellipsis: true,
      width: 260,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{record.question || '-'}</Typography.Text>
          <Typography.Text type="secondary" copyable>
            {record.run_id}
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
      render: (_, record) => <AgentTypeTag value={record.agent_type} />,
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
      title: '症状',
      dataIndex: 'symptom',
      ellipsis: true,
      search: false,
      renderText: (_, record) => record.symptom || '-',
    },
    {
      title: '根因',
      dataIndex: 'root_cause',
      ellipsis: true,
      search: false,
      renderText: (_, record) => record.root_cause || '-',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 220,
      search: false,
      render: (_, record) => renderTags(record.tags),
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
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="detail"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setSelectedCase(record)}
        >
          详情
        </Button>,
        <Popconfirm
          key="delete"
          title="确认下架该 Run 提取的案例吗？"
          description="下架后该 Run 对应案例不会继续参与 few-shot。"
          okText="下架"
          okButtonProps={{
            danger: true,
            loading: deletingRunID === record.run_id,
          }}
          cancelText="取消"
          onConfirm={() => handleDeleteCase(record.run_id)}
        >
          <Button
            danger
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            loading={deletingRunID === record.run_id}
          >
            下架
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  const routeColumns: ProColumns<API.AgentRouteFeedback>[] = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: '搜索用户消息 / Agent',
      },
    },
    {
      title: '用户消息',
      dataIndex: 'message',
      ellipsis: true,
      search: false,
      renderText: (_, record) => record.message || '-',
    },
    {
      title: '用户选择',
      dataIndex: 'selected_agent_type',
      width: 150,
      valueType: 'select',
      fieldProps: {
        loading: agentOptionsLoading,
        options: agentOptions,
      },
      renderText: (_, record) => getAgentTypeLabel(record.selected_agent_type),
    },
    {
      title: '自动路由',
      dataIndex: 'routed_agent_type',
      width: 150,
      search: false,
      renderText: (_, record) => getAgentTypeLabel(record.routed_agent_type),
    },
    {
      title: '置信度',
      dataIndex: 'routed_confidence',
      width: 100,
      search: false,
      renderText: (_, record) =>
        `${Math.round((record.routed_confidence || 0) * 100)}%`,
    },
    {
      title: '一致性',
      dataIndex: 'matched',
      width: 120,
      valueType: 'select',
      fieldProps: {
        options: MATCH_OPTIONS,
      },
      render: (_, record) =>
        record.matched ? (
          <Tag color="success">一致</Tag>
        ) : (
          <Tag color="warning">不一致</Tag>
        ),
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
      width: 110,
      fixed: 'right',
      render: (_, record) => [
        <Popconfirm
          key="delete"
          title="确认删除该路由学习样本吗？"
          description="删除后该样本不会继续参与路由 few-shot 与校准。"
          okText="删除"
          okButtonProps={{
            danger: true,
            loading: deletingFeedbackID === record.id,
          }}
          cancelText="取消"
          onConfirm={() => handleDeleteRouteFeedback(record.id)}
        >
          <Button
            danger
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            loading={deletingFeedbackID === record.id}
          >
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];
  const comfortableCaseColumns = withComfortableTableColumns(caseColumns);
  const comfortableRouteColumns = withComfortableTableColumns(routeColumns);

  return (
    <PageContainer title="Agent 学习数据">
      <Tabs
        items={[
          {
            key: 'case',
            label: 'Case Library',
            children: (
              <ProTable<
                API.AgentDiagnosisCase,
                API.AgentDiagnosisCaseListParams
              >
                rowKey="id"
                actionRef={caseActionRef}
                columns={comfortableCaseColumns}
                scroll={getComfortableTableScroll(comfortableCaseColumns, {
                  x: 1320,
                })}
                pagination={{ defaultPageSize: 10, showSizeChanger: true }}
                search={{ labelWidth: 90 }}
                request={async (params) => {
                  const res = await getAgentDiagnosisCaseList(params, {
                    skipErrorHandler: true,
                  });
                  return {
                    data: res.data.items || [],
                    success: true,
                    total: res.data.total || 0,
                  };
                }}
              />
            ),
          },
          {
            key: 'route',
            label: 'Route Learning',
            children: (
              <ProTable<
                API.AgentRouteFeedback,
                API.AgentRouteFeedbackListParams
              >
                rowKey="id"
                actionRef={routeActionRef}
                columns={comfortableRouteColumns}
                scroll={getComfortableTableScroll(comfortableRouteColumns, {
                  x: 1100,
                })}
                pagination={{ defaultPageSize: 10, showSizeChanger: true }}
                search={{ labelWidth: 90 }}
                request={async (params) => {
                  const res = await getAgentRouteFeedbackList(params, {
                    skipErrorHandler: true,
                  });
                  return {
                    data: res.data.items || [],
                    success: true,
                    total: res.data.total || 0,
                  };
                }}
              />
            ),
          },
        ]}
      />
      <CaseDetailDrawer
        item={selectedCase}
        open={Boolean(selectedCase)}
        onClose={() => setSelectedCase(undefined)}
        onOpenRun={openRunDetail}
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

const CaseDetailDrawer = ({
  item,
  onClose,
  onOpenRun,
  open,
}: {
  item?: API.AgentDiagnosisCase;
  onClose: () => void;
  onOpenRun: (runID: string) => void;
  open: boolean;
}) => (
  <Drawer
    destroyOnHidden
    open={open}
    title={item ? `Case 详情 / ${item.id}` : 'Case 详情'}
    width="62vw"
    onClose={onClose}
  >
    {item ? (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Agent">
            <AgentTypeTag value={item.agent_type} />
          </Descriptions.Item>
          <Descriptions.Item label="集群">
            {item.cluster_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Run">
            <Button
              type="link"
              size="small"
              onClick={() => onOpenRun(item.run_id)}
            >
              {item.run_id}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {item.created_at || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="问题" span={2}>
            {item.question || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="症状" span={2}>
            {item.symptom || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="根因" span={2}>
            {item.root_cause || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="标签" span={2}>
            {renderTags(item.tags)}
          </Descriptions.Item>
        </Descriptions>
        <JsonCodeBlock value={prettyJson(item.tool_trace || [])} />
      </Space>
    ) : null}
  </Drawer>
);

export default Learning;
