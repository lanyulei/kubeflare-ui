import { HddOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import { Space } from 'antd';
import { createStyles } from 'antd-style';
import { useRef } from 'react';
import { ClusterTableSearch } from '@/components';
import { getClusterPersistentVolumeClaimList } from '@/services/kubeflare/cluster/resource';
import StatusText from './StatusText';

const DEFAULT_PAGE_SIZE = 10;

const useStyles = createStyles(({ token }) => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  table: {
    '.ant-pro-card': {
      backgroundColor: 'transparent',
    },
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
  },
  name: {
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: '100%',
    gap: token.marginMD,
  },
  icon: {
    flex: '0 0 auto',
    color: token.colorTextSecondary,
    fontSize: 28,
    lineHeight: 1,
  },
  nameText: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

type PersistentVolumeClaimTableProps = {
  storageClassName?: string;
};

const renderMountStatus = (mounted?: boolean) => {
  if (mounted === undefined) {
    return '-';
  }

  return mounted ? '已挂载' : '未挂载';
};

const getResourceDetailPath = (
  type: API.ClusterResourceCreateType,
  name?: string,
  namespace?: string,
) =>
  `/cluster/resource/detail/${encodeURIComponent(type)}/${encodeURIComponent(
    namespace || '-',
  )}/${encodeURIComponent(name || '-')}`;

const PersistentVolumeClaimTable = ({
  storageClassName,
}: PersistentVolumeClaimTableProps) => {
  const { styles } = useStyles();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const columns: ProColumns<API.ClusterPersistentVolumeClaimItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, record) => (
        <span className={styles.name}>
          <HddOutlined className={styles.icon} />
          <Link
            className={styles.nameText}
            to={getResourceDetailPath(
              'PersistentVolumeClaim',
              record.name,
              record.namespace,
            )}
          >
            {record.name || '-'}
          </Link>
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 140,
      render: (_, record) => <StatusText status={record.status} />,
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      width: 120,
      renderText: (_, record) => record.capacity || '-',
    },
    {
      title: '挂载状态',
      dataIndex: 'mounted',
      width: 140,
      renderText: (_, record) => renderMountStatus(record.mounted),
    },
    {
      title: '项目',
      dataIndex: 'namespace',
      ellipsis: true,
      width: 180,
      renderText: (_, record) => record.namespace || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
      width: 190,
    },
  ];

  return (
    <div className={styles.content}>
      <ProTable<API.ClusterPersistentVolumeClaimItem>
        className={styles.table}
        rowKey={(record) =>
          record.id || `${record.namespace || '-'}-${record.name}`
        }
        actionRef={actionRef}
        search={false}
        columns={columns}
        pagination={{
          defaultPageSize: DEFAULT_PAGE_SIZE,
          showSizeChanger: true,
        }}
        request={async (params) => {
          const current = params.current || 1;
          const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
          const res = await getClusterPersistentVolumeClaimList({
            keyword: keywordRef.current.trim() || undefined,
            limit: 500,
          });
          const items = (res.data.items || []).filter(
            (item) => item.storageClassName === storageClassName,
          );

          return {
            data: items.slice((current - 1) * pageSize, current * pageSize),
            success: true,
            total: items.length,
          };
        }}
        headerTitle={
          <Space className={styles.toolbar}>
            <ClusterTableSearch
              clearTriggersSearch
              style={{ width: 260 }}
              placeholder="按名称搜索"
              onSearch={(value) => {
                keywordRef.current = value;
                actionRef.current?.reloadAndRest?.();
              }}
            />
          </Space>
        }
      />
    </div>
  );
};

export default PersistentVolumeClaimTable;
