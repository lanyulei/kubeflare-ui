import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useRef } from 'react';
import { getClusterNodeEventList } from '@/services/kubeflare/cluster/node';

const DEFAULT_PAGE_SIZE = 10;

type EventTableProps = {
  name?: string;
  namespace?: string;
  type?: API.ClusterWorkloadType;
};

const useStyles = createStyles(({ token }) => ({
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

const EventTable = ({ name, namespace, type }: EventTableProps) => {
  const { styles } = useStyles();
  const actionRef = useRef<ActionType | null>(null);
  const continueTokenRef = useRef<Record<number, string>>({ 1: '' });
  const pageSizeRef = useRef(DEFAULT_PAGE_SIZE);
  const getEventTypeClassName = (eventType?: string) => {
    const normalizedType = eventType?.toLowerCase();

    if (normalizedType === 'normal') {
      return styles.eventTypeNormal;
    }
    if (normalizedType === 'warning') {
      return styles.eventTypeWarning;
    }
    return styles.eventTypeError;
  };
  const columns: ProColumns<API.ClusterNodeEventItem>[] = [
    {
      title: '类型',
      dataIndex: 'type',
      width: 110,
      render: (_, record) => (
        <span className={styles.eventType}>
          <span
            className={[
              styles.eventTypeDot,
              getEventTypeClassName(record.type),
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

  return (
    <ProTable<API.ClusterNodeEventItem>
      rowKey="id"
      actionRef={actionRef}
      search={false}
      options={{
        density: true,
        fullScreen: false,
        setting: true,
        reload: () => {
          continueTokenRef.current = { 1: '' };
          actionRef.current?.reloadAndRest?.();
        },
      }}
      columns={columns}
      pagination={{
        pageSize: DEFAULT_PAGE_SIZE,
        showSizeChanger: false,
      }}
      request={async (params) => {
        const current = params.current || 1;
        const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;

        if (pageSizeRef.current !== pageSize) {
          pageSizeRef.current = pageSize;
          continueTokenRef.current = { 1: '' };
        }

        if (!type || !namespace || !name) {
          return {
            data: [],
            success: true,
            total: 0,
          };
        }

        const continueToken = continueTokenRef.current[current] || '';
        const res = await getClusterNodeEventList({
          objectKind: type,
          objectName: name,
          namespace,
          limit: pageSize,
          continue: continueToken || undefined,
        });
        const items = res.data.items || [];
        const nextContinueToken = res.data.continue || '';

        if (nextContinueToken) {
          continueTokenRef.current[current + 1] = nextContinueToken;
        } else {
          delete continueTokenRef.current[current + 1];
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
    />
  );
};

export default EventTable;
