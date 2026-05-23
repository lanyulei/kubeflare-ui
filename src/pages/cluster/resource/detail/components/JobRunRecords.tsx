import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { getRecordValue, getStringValue } from './helpers';
import StatusText from './StatusText';

type JobRunRecord = {
  id: string;
  index: number;
  status?: string;
  message?: string;
  start_time?: string;
  completion_time?: string;
};

type JobRunRecordsProps = {
  revisions?: unknown;
};

const getRevisionTime = (record: Record<string, unknown>, keys: string[]) =>
  keys.map((key) => getStringValue(record[key])).find(Boolean);

const parseRevisions = (revisions?: unknown): JobRunRecord[] => {
  const source =
    typeof revisions === 'string'
      ? (() => {
          try {
            return JSON.parse(revisions);
          } catch (_error) {
            return undefined;
          }
        })()
      : revisions;

  const records = getRecordValue(source);

  if (!records) {
    return [];
  }

  return Object.entries(records)
    .map(([key, value], index) => {
      const record = getRecordValue(value) || {};

      return {
        id: getStringValue(record.uid) || key,
        index: Number(key) || index + 1,
        status: getStringValue(record.status),
        message: getStringValue(record.message),
        start_time: getRevisionTime(record, [
          'start_time',
          'startTime',
          'start-time',
        ]),
        completion_time: getRevisionTime(record, [
          'completion_time',
          'completionTime',
          'completion-time',
        ]),
      };
    })
    .sort((first, second) => first.index - second.index);
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }

  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : value;
};

const columns: ProColumns<JobRunRecord>[] = [
  {
    title: '序号',
    dataIndex: 'index',
    width: 110,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 160,
    render: (_, record) => <StatusText status={record.status} />,
  },
  {
    title: '消息',
    dataIndex: 'message',
    ellipsis: true,
    renderText: (_, record) => record.message || '-',
  },
  {
    title: '开始时间',
    dataIndex: 'start_time',
    width: 210,
    renderText: (_, record) => formatDateTime(record.start_time),
  },
  {
    title: '结束时间',
    dataIndex: 'completion_time',
    width: 210,
    renderText: (_, record) => formatDateTime(record.completion_time),
  },
];

const JobRunRecords = ({ revisions }: JobRunRecordsProps) => (
  <ProTable<JobRunRecord>
    rowKey="id"
    search={false}
    options={{
      density: false,
      fullScreen: false,
      reload: false,
      setting: false,
    }}
    columns={columns}
    dataSource={parseRevisions(revisions)}
    pagination={{
      pageSize: 10,
      showSizeChanger: false,
    }}
  />
);

export default JobRunRecords;
