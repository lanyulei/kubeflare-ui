import { SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Card, Empty, Input, Spin, Tabs, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from '@/components';
import {
  getClusterNodeEventList,
  getClusterNodeList,
} from '@/services/kubeflare/cluster/node';
import NodeMetadata from './components/Metadata';
import Pods from './components/Pods';
import RunningStatus from './components/RunningStatus';

const DEFAULT_PAGE_SIZE = 10;
const EVENT_SEARCH_PAGE_SIZE = 500;

const useStyles = createStyles(({ token }) => ({
  content: {
    backgroundColor: token.colorBgContainer,
    border: `1px solid ${token.colorBorder}80`,
    borderRadius: token.borderRadiusLG,
    padding: `20px`,
  },
  moreInfo: {
    marginTop: '15px',
  },
  moreInfoCard: {
    borderColor: `${token.colorBorder}80`,

    '.ant-card-body': {
      paddingTop: 2,
    },
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  statusDotDefault: {
    backgroundColor: token.colorTextQuaternary,
  },
  statusDotError: {
    backgroundColor: token.colorError,
  },
  statusDotSuccess: {
    backgroundColor: token.colorSuccess,
  },
  statusDotWarning: {
    backgroundColor: token.colorWarning,
  },
  eventTable: {
    '.ant-pro-card': {
      backgroundColor: 'transparent',
    },
    '.ant-pro-card-body': {
      padding: 0,
    },
    '.ant-pro-table-list-toolbar-container': {
      paddingTop: 0,
    },
    '.ant-table-container': {
      overflow: 'hidden',
      borderRadius: token.borderRadiusLG,
    },
    '.ant-table-thead > tr > th': {
      backgroundColor: token.colorFillQuaternary,
      color: token.colorTextSecondary,
      fontWeight: 500,
      lineHeight: 1.5,
    },
    '.ant-table-tbody > tr > td': {
      backgroundColor: token.colorBgContainer,
      borderBottomColor: token.colorFillQuaternary,
      color: token.colorText,
      lineHeight: 1.5,
    },
    '.ant-table-tbody > tr.ant-table-row:hover > td': {
      backgroundColor: token.colorFillTertiary,
    },
    '.ant-pagination': {
      margin: `${token.marginSM}px 0 0`,
    },
  },
  eventType: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    whiteSpace: 'nowrap',
  },
  eventTypeDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  eventTypeNormal: {
    backgroundColor: token.colorSuccess,
  },
  eventTypeWarning: {
    backgroundColor: token.colorWarning,
  },
  eventTypeError: {
    backgroundColor: token.colorError,
  },
}));

const getNodeIp = (record?: API.ClusterNodeItem) =>
  record?.ip || record?.internal_ip || record?.external_ip || '-';

const getNodeVersion = (record?: API.ClusterNodeItem) =>
  record?.version || record?.kubelet_version || '-';

const getNodeRoles = (roles?: string[] | string) => {
  if (Array.isArray(roles)) {
    return roles;
  }
  if (roles) {
    return roles
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);
  }
  return [];
};

const getNodeRoleLabel = (role: string) => {
  const normalizedRole = role.trim().toLowerCase();

  if (normalizedRole === 'control-plane' || normalizedRole === 'master') {
    return '控制平面节点';
  }
  if (normalizedRole === 'worker') {
    return '工作节点';
  }
  return role;
};

const getNodeStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'ready') {
    return '运行中';
  }
  if (normalizedStatus === 'notready') {
    return '异常';
  }
  if (normalizedStatus === 'unknown') {
    return '未知';
  }
  if (normalizedStatus === 'schedulingdisabled') {
    return '已禁止调度';
  }
  return status || '-';
};

const getNodeStatusType = (
  status?: string,
): 'default' | 'error' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'ready') {
    return 'success';
  }
  if (normalizedStatus === 'notready' || normalizedStatus === 'unknown') {
    return 'error';
  }
  if (normalizedStatus === 'schedulingdisabled') {
    return 'warning';
  }
  return 'default';
};

const formatCreateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : value;
};

const formatRelativeTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const time = dayjs(value);
  if (!time.isValid()) {
    return value;
  }

  const diffSeconds = Math.max(0, dayjs().diff(time, 'second'));
  const diffDays = Math.floor(diffSeconds / 86400);
  if (diffDays > 0) {
    return `${diffDays} 天前`;
  }
  const diffHours = Math.floor(diffSeconds / 3600);
  if (diffHours > 0) {
    return `${diffHours} 小时前`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes > 0) {
    return `${diffMinutes} 分钟前`;
  }
  return '刚刚';
};

const getEventTypeLabel = (type?: string) => {
  const normalizedType = type?.toLowerCase();

  if (normalizedType === 'normal') {
    return '正常';
  }
  if (normalizedType === 'warning') {
    return '警告';
  }
  return type || '-';
};

const matchEventKeyword = (
  event: API.ClusterNodeEventItem,
  keyword?: string,
) => {
  const normalizedKeyword = keyword?.trim().toLowerCase();

  if (!normalizedKeyword) {
    return true;
  }

  return [
    event.type,
    getEventTypeLabel(event.type),
    event.reason,
    event.source,
    event.message,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedKeyword));
};

const getEventTypeClassName = (
  type: string | undefined,
  styles: ReturnType<typeof useStyles>['styles'],
) => {
  const normalizedType = type?.toLowerCase();

  if (normalizedType === 'normal') {
    return styles.eventTypeNormal;
  }
  if (normalizedType === 'warning') {
    return styles.eventTypeWarning;
  }
  return styles.eventTypeError;
};

const decodeNodeName = (name?: string) => {
  if (!name) {
    return '';
  }

  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};

const ClusterNodeDetail = () => {
  const { styles } = useStyles();
  const params = useParams<{ name?: string }>();
  const nodeName = useMemo(() => decodeNodeName(params.name), [params.name]);
  const eventActionRef = useRef<ActionType | null>(null);
  const eventKeywordRef = useRef('');
  const eventContinueTokenRef = useRef<Record<number, string>>({ 1: '' });
  const eventPageSizeRef = useRef(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [eventKeywordDraft, setEventKeywordDraft] = useState('');
  const [node, setNode] = useState<API.ClusterNodeItem>();

  useEffect(() => {
    let mounted = true;

    const fetchNode = async () => {
      setLoading(true);
      const res = await getClusterNodeList({ keyword: nodeName });
      const items = res.data.items || [];
      const nextNode =
        items.find((item) => item.name === nodeName) ||
        items.find((item) => item.name?.includes(nodeName));

      if (mounted) {
        setNode(nextNode);
        setLoading(false);
      }
    };

    if (nodeName) {
      fetchNode();
    }

    return () => {
      mounted = false;
    };
  }, [nodeName]);

  const roles =
    getNodeRoles(node?.roles).map(getNodeRoleLabel).join('、') || '-';
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    error: styles.statusDotError,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };
  const eventColumns: ProColumns<API.ClusterNodeEventItem>[] = [
    {
      title: '类型',
      dataIndex: 'type',
      width: 110,
      render: (_, record) => (
        <span className={styles.eventType}>
          <span
            className={[
              styles.eventTypeDot,
              getEventTypeClassName(record.type, styles),
            ].join(' ')}
          />
          <span>{getEventTypeLabel(record.type)}</span>
        </span>
      ),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      width: 160,
      ellipsis: true,
      renderText: (_, record) => record.reason || '-',
    },
    {
      title: '发生时间',
      dataIndex: 'event_time',
      width: 160,
      renderText: (_, record) => formatRelativeTime(record.event_time),
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 210,
      ellipsis: true,
      render: (_, record) => {
        const source = record.source || '-';

        return (
          <Tooltip title={source} placement="topLeft">
            <span>{source}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '消息',
      dataIndex: 'message',
      ellipsis: true,
      render: (_, record) => {
        const message = record.message || '-';

        return (
          <Tooltip title={message} placement="topLeft">
            <span>{message}</span>
          </Tooltip>
        );
      },
    },
  ];
  const moreInfoTabItems = [
    {
      key: 'status',
      label: '运行状态',
      children: <RunningStatus node={node} />,
    },
    {
      key: 'pods',
      label: '容器组',
      children: <Pods nodeName={nodeName} />,
    },
    {
      key: 'metadata',
      label: '元数据',
      children: <NodeMetadata node={node} />,
    },
    {
      key: 'events',
      label: '事件',
      children: (
        <ProTable<API.ClusterNodeEventItem>
          rowKey="id"
          actionRef={eventActionRef}
          className={styles.eventTable}
          search={false}
          options={{
            density: true,
            fullScreen: false,
            setting: true,
            reload: () => {
              eventContinueTokenRef.current = { 1: '' };
              eventActionRef.current?.reloadAndRest?.();
            },
          }}
          columns={eventColumns}
          pagination={{
            pageSize: DEFAULT_PAGE_SIZE,
            showSizeChanger: false,
          }}
          request={async (params) => {
            const current = params.current || 1;
            const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
            const keyword = eventKeywordRef.current.trim();

            if (eventPageSizeRef.current !== pageSize) {
              eventPageSizeRef.current = pageSize;
              eventContinueTokenRef.current = { 1: '' };
            }

            if (keyword) {
              let nextContinueToken = '';
              const allItems: API.ClusterNodeEventItem[] = [];

              do {
                const res = await getClusterNodeEventList({
                  nodeName,
                  limit: EVENT_SEARCH_PAGE_SIZE,
                  continue: nextContinueToken || undefined,
                });

                allItems.push(...(res.data.items || []));
                nextContinueToken = res.data.continue || '';
              } while (nextContinueToken);

              const items = allItems.filter((event) =>
                matchEventKeyword(event, keyword),
              );
              const start = (current - 1) * pageSize;

              return {
                data: items.slice(start, start + pageSize),
                success: true,
                total: items.length,
              };
            }

            const continueToken = eventContinueTokenRef.current[current] || '';
            const res = await getClusterNodeEventList({
              nodeName,
              limit: pageSize,
              continue: continueToken || undefined,
            });
            const items = res.data.items || [];
            const nextContinueToken = res.data.continue || '';

            if (nextContinueToken) {
              eventContinueTokenRef.current[current + 1] = nextContinueToken;
            } else {
              delete eventContinueTokenRef.current[current + 1];
            }

            const total =
              (current - 1) * pageSize +
              items.length +
              (nextContinueToken ? pageSize : 0);

            return {
              data: items,
              success: true,
              total,
            };
          }}
          headerTitle={
            <Input
              allowClear
              value={eventKeywordDraft}
              suffix={<SearchOutlined />}
              style={{ width: 260 }}
              placeholder="搜索事件原因 / 来源 / 消息"
              onChange={(event) => {
                setEventKeywordDraft(event.target.value);
              }}
              onPressEnter={(event) => {
                eventKeywordRef.current = event.currentTarget.value.trim();
                eventContinueTokenRef.current = { 1: '' };
                eventActionRef.current?.reloadAndRest?.();
              }}
            />
          }
        />
      ),
    },
  ];

  return (
    <PageContainer title={nodeName || '节点详情'} onBack={() => history.back()}>
      <div>
        <SectionTitle>基本信息</SectionTitle>
        <div className={styles.content}>
          <Spin spinning={loading}>
            {node ? (
              <ProDescriptions<API.ClusterNodeItem>
                column={3}
                dataSource={node}
                columns={[
                  {
                    title: '状态',
                    dataIndex: 'status',
                    render: (_, record) => {
                      const statusType = getNodeStatusType(record.status);

                      return (
                        <span className={styles.status}>
                          <span
                            className={[
                              styles.statusDot,
                              statusDotClassNames[statusType],
                            ].join(' ')}
                          />
                          <span>{getNodeStatusLabel(record.status)}</span>
                        </span>
                      );
                    },
                  },
                  {
                    title: 'IP 地址',
                    renderText: (_, record) => getNodeIp(record),
                  },
                  {
                    title: '角色',
                    dataIndex: 'roles',
                    renderText: () => roles,
                  },
                  {
                    title: '操作系统版本',
                    dataIndex: 'os_image',
                    renderText: (_, record) => record.os_image || '-',
                  },
                  {
                    title: '操作系统类型',
                    dataIndex: 'operating_system',
                    renderText: (_, record) => record.operating_system || '-',
                  },
                  {
                    title: '内核版本',
                    dataIndex: 'kernel_version',
                    renderText: (_, record) => record.kernel_version || '-',
                  },
                  {
                    title: '容器运行时',
                    dataIndex: 'container_runtime_version',
                    renderText: (_, record) =>
                      record.container_runtime_version || '-',
                  },
                  {
                    title: 'kubelet 版本',
                    dataIndex: 'kubelet_version',
                    renderText: (_, record) => getNodeVersion(record),
                  },
                  {
                    title: 'kube-proxy 版本',
                    dataIndex: 'kube_proxy_version',
                    renderText: (_, record) => record.kube_proxy_version || '-',
                  },
                  {
                    title: '系统架构',
                    dataIndex: 'architecture',
                    renderText: (_, record) => record.architecture || '-',
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'create_time',
                    renderText: (_, record) =>
                      formatCreateTime(record.create_time),
                  },
                ]}
              />
            ) : (
              <Empty description={loading ? '加载中' : '未找到节点'} />
            )}
          </Spin>
        </div>
      </div>
      <div className={styles.moreInfo}>
        {/* <SectionTitle>更多信息</SectionTitle> */}
        <Card className={styles.moreInfoCard}>
          <Tabs items={moreInfoTabItems} />
        </Card>
      </div>
    </PageContainer>
  );
};

export default ClusterNodeDetail;
