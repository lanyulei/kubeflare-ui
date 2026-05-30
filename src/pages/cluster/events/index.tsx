import { LinkOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import { Alert, App, Select, Space, Switch, Tag, Tooltip } from 'antd';
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
  mergeEventItems,
  resourceKindLabels,
  sortEventsByTime,
} from '@/components/ClusterEventCenter/eventHelpers';
import {
  getClusterEventList,
  matchClusterEvent,
} from '@/services/kubeflare/cluster/event';
import { getClusterNamespaceList } from '@/services/kubeflare/cluster/namespace';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';
const DEFAULT_LIMIT = 300;

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
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    flexWrap: 'wrap',
  },
  live: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    marginRight: 10,
  },
  object: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    minWidth: 0,
  },
}));

const watchStatusText: Record<string, string> = {
  connected: '实时中',
  connecting: '连接中',
  error: '重连等待',
  reconnecting: '重连中',
};

const kindOptions = Object.entries(resourceKindLabels).map(
  ([value, label]) => ({
    label: `${label}（${value}）`,
    value,
  }),
);

const normalizeFilters = (
  values: EventFilterFormValues,
): API.ClusterEventListParams => ({
  keyword: values.keyword?.trim() || undefined,
  namespace: values.namespace,
  regardingKind: values.regardingKind,
  regardingName: values.regardingName?.trim() || undefined,
  type: values.type,
  limit: DEFAULT_LIMIT,
});

const GlobalEvents = () => {
  const { message } = App.useApp();
  const { styles } = useStyles();
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
  const [searchValues, setSearchValues] = useState<EventFilterFormValues>({});
  const [toolbarFilters, setToolbarFilters] = useState<EventFilterFormValues>(
    {},
  );
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
      title: '对象名称',
      dataIndex: 'regardingName',
      hideInTable: true,
      fieldProps: {
        allowClear: true,
        placeholder: '输入对象名称',
      },
    },
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        allowClear: true,
        placeholder: '原因 / 消息 / 来源',
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      search: false,
      render: (_, record) => <EventTypeBadge type={record.type} />,
    },
    {
      title: '发生时间',
      dataIndex: 'event_time',
      width: 150,
      search: false,
      renderText: (_, record) => formatRelativeTime(record.event_time),
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      width: 150,
      ellipsis: true,
      search: false,
      renderText: (_, record) => record.namespace || '-',
    },
    {
      title: '相关对象',
      dataIndex: 'regarding',
      width: 230,
      ellipsis: true,
      search: false,
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
      search: false,
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
      search: false,
      renderText: (_, record) => record.series_count || '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 220,
      ellipsis: true,
      search: false,
      renderText: (_, record) => record.source || '-',
    },
    {
      title: '消息',
      dataIndex: 'message',
      ellipsis: true,
      search: false,
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

  const handleSearch = async (values: EventFilterFormValues) => {
    setSearchValues(values);
    const nextFilters = normalizeFilters({
      ...values,
      ...toolbarFilters,
    });
    filtersRef.current = nextFilters;
    setFilters(nextFilters);
    await loadEvents(nextFilters);
  };

  const handleReset = async () => {
    setSearchValues({});
    setToolbarFilters({});
    const nextFilters = { limit: DEFAULT_LIMIT };
    filtersRef.current = nextFilters;
    setFilters(nextFilters);
    await loadEvents(nextFilters);
  };

  const handleToolbarFilterChange = async (
    name: keyof EventFilterFormValues,
    value?: string,
  ) => {
    const nextToolbarFilters = {
      ...toolbarFilters,
      [name]: value,
    };
    setToolbarFilters(nextToolbarFilters);
    const nextFilters = normalizeFilters({
      ...searchValues,
      ...nextToolbarFilters,
    });
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
        <ProTable<API.ClusterEventItem>
          rowKey={(record) => getEventItemKey(record)}
          columns={columns}
          dataSource={filteredItems}
          loading={loading}
          search={{
            defaultCollapsed: false,
            labelWidth: 'auto',
            span: 12,
            optionRender: (_searchConfig, _formProps, dom) => [
              <Space className={styles.live} key="live-watch">
                <ThunderboltOutlined />
                <span>实时 Watch</span>
                <Switch checked={liveEnabled} onChange={setLiveEnabled} />
              </Space>,
              ...dom,
            ],
          }}
          options={{
            reload: () => loadEvents(filtersRef.current),
          }}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
          }}
          headerTitle={
            <Space className={styles.toolbar}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={namespaceOptions}
                placeholder="全部命名空间"
                style={{ width: 180 }}
                value={toolbarFilters.namespace}
                onChange={(value) =>
                  handleToolbarFilterChange('namespace', value)
                }
              />
              <Select
                allowClear
                options={[
                  { label: '正常', value: 'Normal' },
                  { label: '警告', value: 'Warning' },
                ]}
                placeholder="全部类型"
                style={{ width: 130 }}
                value={toolbarFilters.type}
                onChange={(value) => handleToolbarFilterChange('type', value)}
              />
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={kindOptions}
                placeholder="全部资源对象"
                style={{ width: 220 }}
                value={toolbarFilters.regardingKind}
                onChange={(value) =>
                  handleToolbarFilterChange('regardingKind', value)
                }
              />
            </Space>
          }
          onSubmit={handleSearch}
          onReset={handleReset}
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
