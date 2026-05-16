import { SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Input, Tooltip } from 'antd';
import { useRef, useState } from 'react';
import { getClusterNodeEventList } from '@/services/kubeflare/cluster/node';
import { DEFAULT_PAGE_SIZE, EVENT_SEARCH_PAGE_SIZE } from '../constants';
import {
  formatRelativeTime,
  getEventTypeLabel,
  matchEventKeyword,
} from '../helpers';
import useStyles from '../styles';

type EventTableProps = {
  nodeName: string;
};

const EventTable = ({ nodeName }: EventTableProps) => {
  const { styles } = useStyles();
  const eventActionRef = useRef<ActionType | null>(null);
  const eventKeywordRef = useRef('');
  const eventContinueTokenRef = useRef<Record<number, string>>({ 1: '' });
  const eventPageSizeRef = useRef(DEFAULT_PAGE_SIZE);
  const [eventKeywordDraft, setEventKeywordDraft] = useState('');
  const getEventTypeClassName = (type?: string) => {
    const normalizedType = type?.toLowerCase();

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
      columns={columns}
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
  );
};

export default EventTable;
