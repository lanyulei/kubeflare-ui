import {
  ClearOutlined,
  LinkOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EventDetailDrawer,
  EventTypeBadge,
  useClusterEventWatch,
} from '@/components';
import {
  formatRelativeTime,
  getEventItemKey,
  getEventMessage,
  getEventObjectDetailPath,
  getEventObjectText,
  getNormalCount,
  getWarningCount,
  mergeEventItems,
  resourceKindLabels,
  sortEventsByTime,
} from '@/components/ClusterEventCenter/eventHelpers';
import { getClusterNamespaceList } from '@/services/kubeflare/cluster/namespace';
import {
  getClusterEventList,
  matchClusterEvent,
} from '@/services/kubeflare/cluster/event';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';
const DEFAULT_LIMIT = 300;
const ALL_NAMESPACES_VALUE = '__all__';

type EventFilterFormValues = {
  keyword?: string;
  namespace?: string;
  regardingKind?: string;
  regardingName?: string;
  type?: string;
};

const useStyles = createStyles(({ token }) => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  filters: {
    padding: token.padding,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgContainer,
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: token.marginSM,

    '@media (max-width: 992px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 576px)': {
      gridTemplateColumns: '1fr',
    },
  },
  summaryItem: {
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgContainer,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
    flexWrap: 'wrap',
  },
  live: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
  },
  object: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    minWidth: 0,
  },
}));

const kindOptions = Object.entries(resourceKindLabels).map(
  ([value, label]) => ({
    label: `${label}（${value}）`,
    value,
  }),
);

const watchStatusText: Record<string, string> = {
  connected: '实时中',
  connecting: '连接中',
  error: '重连等待',
  idle: '已暂停',
  reconnecting: '重连中',
};

const normalizeFilters = (
  values: EventFilterFormValues,
): API.ClusterEventListParams => ({
  keyword: values.keyword?.trim() || undefined,
  namespace:
    values.namespace && values.namespace !== ALL_NAMESPACES_VALUE
      ? values.namespace
      : undefined,
  regardingKind: values.regardingKind,
  regardingName: values.regardingName?.trim() || undefined,
  type: values.type,
  limit: DEFAULT_LIMIT,
});

const GlobalEvents = () => {
  const { message } = App.useApp();
  const { styles } = useStyles();
  const [form] = Form.useForm<EventFilterFormValues>();
  const [filters, setFilters] = useState<API.ClusterEventListParams>({
    limit: DEFAULT_LIMIT,
  });
  const filtersRef = useRef<API.ClusterEventListParams>({
    limit: DEFAULT_LIMIT,
  });
  const [items, setItems] = useState<API.ClusterEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [namespaceOptions, setNamespaceOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [resourceVersion, setResourceVersion] = useState<string>();
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<API.ClusterEventItem>();
  const [detailOpen, setDetailOpen] = useState(false);
  const watchFilters = useMemo(
    () => ({
      ...filters,
      continue: undefined,
      limit: undefined,
    }),
    [filters],
  );
  const {
    clearItems: clearWatchItems,
    items: watchItems,
    status: watchStatus,
  } = useClusterEventWatch({
    enabled: liveEnabled,
    filters: watchFilters,
    resourceVersion,
    onResourceVersionChange: setResourceVersion,
  });
  const filteredItems = useMemo(
    () =>
      sortEventsByTime(
        items.filter((item) => matchClusterEvent(item, filters)),
      ),
    [filters, items],
  );
  const columns: ProColumns<API.ClusterEventItem>[] = [
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (_, record) => <EventTypeBadge type={record.type} />,
    },
    {
      title: '发生时间',
      dataIndex: 'event_time',
      width: 150,
      renderText: (_, record) => formatRelativeTime(record.event_time),
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      width: 150,
      ellipsis: true,
      renderText: (_, record) => record.namespace || '-',
    },
    {
      title: '相关对象',
      dataIndex: 'regarding',
      width: 230,
      ellipsis: true,
      render: (_, record) => {
        const objectText = getEventObjectText(record.regarding);
        const path = getEventObjectDetailPath(record.regarding);
        const content = (
          <span className={styles.object}>
            {path ? <LinkOutlined /> : null}
            <span>{objectText}</span>
          </span>
        );

        return (
          <Tooltip title={objectText} placement="topLeft">
            {path ? (
              <Link
                to={path}
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                {content}
              </Link>
            ) : (
              content
            )}
          </Tooltip>
        );
      },
    },
    {
      title: '原因 / 动作',
      dataIndex: 'reason',
      width: 210,
      ellipsis: true,
      render: (_, record) => (
        <Space size={4} wrap>
          <Tag>{record.reason || '-'}</Tag>
          {record.action ? <Tag color="blue">{record.action}</Tag> : null}
        </Space>
      ),
    },
    {
      title: '次数',
      dataIndex: 'series_count',
      width: 90,
      renderText: (_, record) => record.series_count || '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 220,
      ellipsis: true,
      renderText: (_, record) => record.source || '-',
    },
    {
      title: '消息',
      dataIndex: 'message',
      ellipsis: true,
      render: (_, record) => {
        const eventMessage = getEventMessage(record);

        return (
          <Tooltip title={eventMessage} placement="topLeft">
            <span>{eventMessage}</span>
          </Tooltip>
        );
      },
    },
  ];

  const loadNamespaceOptions = useCallback(async () => {
    const res = await getClusterNamespaceList();
    setNamespaceOptions(
      (res.data.items || []).flatMap((item) =>
        item.name && item.name !== '-'
          ? [
              {
                label: item.name,
                value: item.name,
              },
            ]
          : [],
      ),
    );
  }, []);

  const loadEvents = useCallback(
    async (nextFilters: API.ClusterEventListParams) => {
      setLoading(true);
      try {
        const res = await getClusterEventList(nextFilters, {
          skipErrorHandler: true,
        });
        setItems(sortEventsByTime(res.data.items || []));
        setResourceVersion(res.data.resourceVersion);
        clearWatchItems();
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : '事件列表加载失败，请检查集群事件权限',
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [clearWatchItems, message],
  );

  useEffect(() => {
    loadNamespaceOptions();
    loadEvents(filtersRef.current);

    const reloadEvents = () => {
      setItems([]);
      setResourceVersion(undefined);
      setLiveEnabled(false);
      loadNamespaceOptions();
      loadEvents(filtersRef.current);
    };

    window.addEventListener(CURRENT_CLUSTER_CHANGE_EVENT, reloadEvents);
    return () => {
      window.removeEventListener(CURRENT_CLUSTER_CHANGE_EVENT, reloadEvents);
    };
  }, [loadEvents, loadNamespaceOptions]);

  useEffect(() => {
    if (watchItems.length === 0) {
      return;
    }

    setItems((currentItems) =>
      watchItems.reduce(
        (nextItems, item) => mergeEventItems(nextItems, item),
        currentItems,
      ),
    );
  }, [watchItems]);

  const handleSearch = async () => {
    const nextFilters = normalizeFilters(form.getFieldsValue());
    filtersRef.current = nextFilters;
    setFilters(nextFilters);
    await loadEvents(nextFilters);
  };

  const handleReset = async () => {
    form.resetFields();
    const nextFilters = { limit: DEFAULT_LIMIT };
    filtersRef.current = nextFilters;
    setFilters(nextFilters);
    await loadEvents(nextFilters);
  };

  return (
    <PageContainer title="事件中心">
      <div className={styles.content}>
        <Alert
          showIcon
          type="info"
          message="Kubernetes Events 通常只保留较短时间，适合排障和实时观察，不作为长期告警或审计历史。"
        />
        <div className={styles.filters}>
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col lg={6} md={12} xs={24}>
                <Form.Item label="命名空间" name="namespace">
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={[
                      { label: '全部命名空间', value: ALL_NAMESPACES_VALUE },
                      ...namespaceOptions,
                    ]}
                    placeholder="全部命名空间"
                  />
                </Form.Item>
              </Col>
              <Col lg={4} md={12} xs={24}>
                <Form.Item label="类型" name="type">
                  <Select
                    allowClear
                    options={[
                      { label: '正常', value: 'Normal' },
                      { label: '警告', value: 'Warning' },
                    ]}
                    placeholder="全部类型"
                  />
                </Form.Item>
              </Col>
              <Col lg={5} md={12} xs={24}>
                <Form.Item label="对象类型" name="regardingKind">
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={kindOptions}
                    placeholder="全部对象"
                  />
                </Form.Item>
              </Col>
              <Col lg={5} md={12} xs={24}>
                <Form.Item label="对象名称" name="regardingName">
                  <Input allowClear placeholder="输入对象名称" />
                </Form.Item>
              </Col>
              <Col lg={4} md={12} xs={24}>
                <Form.Item label="关键词" name="keyword">
                  <Input allowClear placeholder="原因 / 消息 / 来源" />
                </Form.Item>
              </Col>
            </Row>
            <div className={styles.toolbar}>
              <Space>
                <Button type="primary" onClick={handleSearch}>
                  查询
                </Button>
                <Button icon={<ClearOutlined />} onClick={handleReset}>
                  重置
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  loading={loading}
                  onClick={() => loadEvents(filters)}
                >
                  刷新
                </Button>
              </Space>
              <Space className={styles.live}>
                <ThunderboltOutlined />
                <span>实时 Watch</span>
                <Switch checked={liveEnabled} onChange={setLiveEnabled} />
                <Tag color={liveEnabled ? 'processing' : 'default'}>
                  {watchStatusText[watchStatus]}
                </Tag>
              </Space>
            </div>
          </Form>
        </div>
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <Statistic title="当前事件" value={filteredItems.length} />
          </div>
          <div className={styles.summaryItem}>
            <Statistic
              title="警告事件"
              value={getWarningCount(filteredItems)}
              valueStyle={{ color: '#d48806' }}
            />
          </div>
          <div className={styles.summaryItem}>
            <Statistic title="正常事件" value={getNormalCount(filteredItems)} />
          </div>
          <div className={styles.summaryItem}>
            <Statistic
              title="ResourceVersion"
              value={resourceVersion || '-'}
              valueStyle={{ fontSize: 18 }}
            />
          </div>
        </div>
        <ProTable<API.ClusterEventItem>
          rowKey={(record) => getEventItemKey(record)}
          columns={columns}
          dataSource={filteredItems}
          loading={loading}
          search={false}
          options={false}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
          }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedEvent(record);
              setDetailOpen(true);
            },
          })}
        />
        <EventDetailDrawer
          event={selectedEvent}
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setSelectedEvent(undefined);
          }}
        />
      </div>
    </PageContainer>
  );
};

export default GlobalEvents;
