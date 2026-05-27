import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Space } from 'antd';
import { createStyles } from 'antd-style';
import { useRef } from 'react';
import { ClusterTableSearch } from '@/components';
import { getClusterCustomResourceList } from '@/services/kubeflare/cluster/resource';
import type { CustomResourceDefinitionVersion } from './customResourceDefinitionHelpers';

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
}));

type CustomResourceTableProps = {
  version?: CustomResourceDefinitionVersion;
};

const CustomResourceTable = ({ version }: CustomResourceTableProps) => {
  const { styles } = useStyles();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const isNamespaced = version?.scope === 'Namespaced';
  const columns: ProColumns<API.ClusterCustomResourceItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
      renderText: (_, record) => record.name || '-',
    },
    ...(isNamespaced
      ? [
          {
            title: '项目',
            dataIndex: 'namespace',
            ellipsis: true,
            width: 180,
            renderText: (_: unknown, record: API.ClusterCustomResourceItem) =>
              record.namespace || '-',
          } as ProColumns<API.ClusterCustomResourceItem>,
        ]
      : []),
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
      width: 190,
    },
  ];

  return (
    <div className={styles.content}>
      <ProTable<API.ClusterCustomResourceItem>
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
          const res = await getClusterCustomResourceList({
            group: version?.group,
            keyword: keywordRef.current.trim() || undefined,
            limit: 500,
            plural: version?.plural,
            scope: version?.scope,
            version: version?.name,
          });
          const items = res.data.items || [];

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

export default CustomResourceTable;
