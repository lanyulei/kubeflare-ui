import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Space } from 'antd';
import { createStyles } from 'antd-style';
import { useRef } from 'react';
import { ClusterTableSearch } from '@/components';
import { getClusterCustomResourceList } from '@/services/kubeflare/cluster/resource';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import type { CustomResourceDefinitionVersion } from './customResourceDefinitionHelpers';

const DEFAULT_PAGE_SIZE = 10;
const KEYWORD_SEARCH_PAGE_SIZE = 500;

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

const getPagedTotal = (
  current: number,
  pageSize: number,
  itemCount: number,
  hasNextPage: boolean,
) => (current - 1) * pageSize + itemCount + (hasNextPage ? pageSize : 0);

const CustomResourceTable = ({ version }: CustomResourceTableProps) => {
  const { styles } = useStyles();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const continueTokenRef = useRef<Record<number, string>>({ 1: '' });
  const pageSizeRef = useRef(DEFAULT_PAGE_SIZE);
  const requestSignatureRef = useRef('');
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
  const tableColumns = withComfortableTableColumns(columns);

  return (
    <div className={styles.content}>
      <ProTable<API.ClusterCustomResourceItem>
        className={styles.table}
        rowKey={(record) =>
          record.id || `${record.namespace || '-'}-${record.name}`
        }
        actionRef={actionRef}
        search={false}
        columns={tableColumns}
        scroll={getComfortableTableScroll(tableColumns, undefined, {
          minScrollX: 720,
        })}
        pagination={{
          defaultPageSize: DEFAULT_PAGE_SIZE,
          showSizeChanger: true,
        }}
        request={async (params) => {
          const current = params.current || 1;
          const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
          const keyword = keywordRef.current.trim() || undefined;
          const requestSignature = [
            keyword || '',
            version?.group || '',
            version?.name || '',
            version?.plural || '',
            version?.scope || '',
          ].join('\n');

          if (
            pageSizeRef.current !== pageSize ||
            requestSignatureRef.current !== requestSignature
          ) {
            pageSizeRef.current = pageSize;
            requestSignatureRef.current = requestSignature;
            continueTokenRef.current = { 1: '' };
          }

          if (keyword) {
            const allItems: API.ClusterCustomResourceItem[] = [];
            let searchContinueToken: string | undefined;

            do {
              const res = await getClusterCustomResourceList({
                group: version?.group,
                keyword,
                limit: KEYWORD_SEARCH_PAGE_SIZE,
                plural: version?.plural,
                scope: version?.scope,
                version: version?.name,
                continue: searchContinueToken,
              });
              allItems.push(...(res.data.items || []));
              searchContinueToken = res.data.continue || undefined;
            } while (searchContinueToken);

            return {
              data: allItems.slice(
                (current - 1) * pageSize,
                current * pageSize,
              ),
              success: true,
              total: allItems.length,
            };
          }

          const continueToken = continueTokenRef.current[current] || '';
          const res = await getClusterCustomResourceList({
            group: version?.group,
            limit: pageSize,
            plural: version?.plural,
            scope: version?.scope,
            version: version?.name,
            continue: continueToken || undefined,
          });
          const items = res.data.items || [];
          const nextContinueToken = res.data.continue || '';

          if (nextContinueToken) {
            continueTokenRef.current[current + 1] = nextContinueToken;
          } else {
            delete continueTokenRef.current[current + 1];
          }

          return {
            data: items,
            success: true,
            total: getPagedTotal(
              current,
              pageSize,
              items.length,
              Boolean(nextContinueToken),
            ),
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
                continueTokenRef.current = { 1: '' };
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
