import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Link, useIntl } from '@umijs/max';
import { App, Button, Select, Space, Tag, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ClusterTableSearch } from '@/components';
import { getClusterNamespaceList } from '@/services/kubeflare/cluster/namespace';
import { createClusterResource } from '@/services/kubeflare/cluster/resource';
import CreateResourceYamlDrawer, {
  type CreateResourceConfig,
} from './CreateResourceYamlDrawer';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';
const DEFAULT_PAGE_SIZE = 10;
const ALL_NAMESPACES_VALUE = '__all__';

const useStyles = createStyles(({ token }) => ({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
  },
  namespaceSelect: {
    width: 180,
  },
  nameText: {
    color: token.colorText,
    lineHeight: token.lineHeight,
  },
  secondaryText: {
    color: token.colorTextTertiary,
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    maxWidth: '100%',
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    whiteSpace: 'nowrap',
  },
  statusEllipsis: {
    minWidth: 0,
  },
  statusTextEllipsis: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  statusDotDefault: {
    backgroundColor: token.colorTextQuaternary,
    boxShadow: `0 0 0 3px ${token.colorFillSecondary}`,
  },
  statusDotError: {
    backgroundColor: token.colorError,
    boxShadow: `0 0 0 3px ${token.colorErrorBg}`,
  },
  statusDotSuccess: {
    backgroundColor: token.colorSuccess,
    boxShadow: `0 0 0 3px ${token.colorSuccessBg}`,
  },
  statusDotWarning: {
    backgroundColor: token.colorWarning,
    boxShadow: `0 0 0 3px ${token.colorWarningBg}`,
  },
}));

type StatusType = 'default' | 'error' | 'success' | 'warning';

type ClusterResourceListPageProps<T extends { id?: string; name: string }> = {
  titleId: string;
  defaultTitle: string;
  columns: ProColumns<T>[];
  rowKey?: string | ((record: T) => string);
  createButtonText?: string;
  createConfig?: CreateResourceConfig;
  renderCreateDrawer?: (props: {
    defaultNamespace?: string;
    loading: boolean;
    namespaceOptions: { label: string; value: string }[];
    open: boolean;
    onCancel: () => void;
    onSubmit: (values: {
      type: API.ClusterResourceCreateType;
      namespace?: string;
      manifest: Record<string, unknown>;
    }) => Promise<void>;
  }) => ReactNode;
  reloadKey?: string | number;
  searchPlaceholder?: string;
  showNamespaceFilter?: boolean;
  onCreate?: (namespace?: string) => void;
  request: (
    params?: API.ClusterResourceListParams,
  ) => Promise<API.ApiResponse<API.ClusterResourceListData<T>>>;
};

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const getStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'running') {
    return '运行中';
  }
  if (normalizedStatus === 'active') {
    return '活跃';
  }
  if (normalizedStatus === 'complete' || normalizedStatus === 'completed') {
    return '已完成';
  }
  if (normalizedStatus === 'bound') {
    return '已绑定';
  }
  if (normalizedStatus === 'pending') {
    return '等待中';
  }
  if (normalizedStatus === 'suspended') {
    return '已暂停';
  }
  if (normalizedStatus === 'failed') {
    return '失败';
  }
  if (normalizedStatus === 'terminating') {
    return '删除中';
  }
  return status || '-';
};

const getStatusType = (status?: string): StatusType => {
  const normalizedStatus = status?.toLowerCase();

  if (
    normalizedStatus === 'running' ||
    normalizedStatus === 'active' ||
    normalizedStatus === 'complete' ||
    normalizedStatus === 'completed' ||
    normalizedStatus === 'bound'
  ) {
    return 'success';
  }
  if (
    normalizedStatus === 'pending' ||
    normalizedStatus === 'suspended' ||
    normalizedStatus === 'terminating'
  ) {
    return 'warning';
  }
  if (normalizedStatus === 'failed' || normalizedStatus === 'lost') {
    return 'error';
  }
  return 'default';
};

export const renderFallbackText = (value?: ReactNode) => value || '-';

export const renderTextList = (values?: string[]) => {
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

export const renderBooleanText = (value?: boolean) => {
  if (value === undefined) {
    return '-';
  }
  return value ? '是' : '否';
};

type CreateStatusColumnOptions = {
  ellipsis?: boolean;
  width?: number;
};

export const createStatusColumn = <T extends { status?: string }>(
  title: string,
  options?: CreateStatusColumnOptions,
): ProColumns<T> => ({
  title,
  dataIndex: 'status',
  ellipsis: options?.ellipsis,
  width: options?.width,
  render: (_, record) => (
    <ResourceStatus ellipsis={options?.ellipsis} status={record.status} />
  ),
});

export const getClusterResourceDetailPath = (
  type: API.ClusterResourceCreateType,
  name?: string,
  namespace?: string,
) =>
  `/cluster/resource/detail/${encodeURIComponent(type)}/${encodeURIComponent(
    namespace || '-',
  )}/${encodeURIComponent(name || '-')}`;

export const createResourceNameColumn = <
  T extends { name: string; namespace?: string },
>(
  type: API.ClusterResourceCreateType,
  title = '名称',
): ProColumns<T> => ({
  title,
  dataIndex: 'name',
  ellipsis: true,
  render: (_, record) => (
    <Link
      to={getClusterResourceDetailPath(type, record.name, record.namespace)}
    >
      {record.name || '-'}
    </Link>
  ),
});

const ResourceStatus = ({
  ellipsis,
  status,
}: {
  ellipsis?: boolean;
  status?: string;
}) => {
  const { styles } = useStyles();
  const statusType = getStatusType(status);
  const statusLabel = getStatusLabel(status);
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    error: styles.statusDotError,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };
  const content = (
    <span
      className={[styles.status, ellipsis ? styles.statusEllipsis : ''].join(
        ' ',
      )}
    >
      <span
        className={[styles.statusDot, statusDotClassNames[statusType]].join(
          ' ',
        )}
      />
      <span className={ellipsis ? styles.statusTextEllipsis : undefined}>
        {statusLabel}
      </span>
    </span>
  );

  if (ellipsis) {
    return <Tooltip title={statusLabel}>{content}</Tooltip>;
  }

  return content;
};

const ClusterResourceListPage = <T extends { id?: string; name: string }>({
  titleId,
  defaultTitle,
  columns,
  rowKey = (record) => record.id || record.name,
  createButtonText = '新建',
  createConfig,
  renderCreateDrawer,
  reloadKey,
  searchPlaceholder,
  showNamespaceFilter = false,
  onCreate,
  request,
}: ClusterResourceListPageProps<T>) => {
  const intl = useIntl();
  const { message } = App.useApp();
  const { styles } = useStyles();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const namespaceRef = useRef<string | undefined>(undefined);
  const [namespaceValue, setNamespaceValue] = useState(ALL_NAMESPACES_VALUE);
  const [namespaceOptions, setNamespaceOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [internalReloadKey, setInternalReloadKey] = useState(0);
  const title = intl.formatMessage({
    id: titleId,
    defaultMessage: defaultTitle,
  });

  const loadNamespaceOptions = useCallback(async () => {
    if (!showNamespaceFilter) {
      return;
    }

    const res = await getClusterNamespaceList();
    const nextOptions = (res.data.items || []).flatMap((item) => {
      if (!item.name || item.name === '-') {
        return [];
      }
      return [
        {
          label: item.name,
          value: item.name,
        },
      ];
    });

    setNamespaceOptions(nextOptions);
  }, [showNamespaceFilter]);

  useEffect(() => {
    const reloadResources = () => {
      keywordRef.current = '';
      namespaceRef.current = undefined;
      setNamespaceValue(ALL_NAMESPACES_VALUE);
      loadNamespaceOptions();
      actionRef.current?.reloadAndRest?.();
    };

    loadNamespaceOptions();
    window.addEventListener(CURRENT_CLUSTER_CHANGE_EVENT, reloadResources);
    return () => {
      window.removeEventListener(CURRENT_CLUSTER_CHANGE_EVENT, reloadResources);
    };
  }, [loadNamespaceOptions]);

  useEffect(() => {
    if (reloadKey === undefined) {
      return;
    }

    actionRef.current?.reloadAndRest?.();
  }, [reloadKey, internalReloadKey]);

  const handleCreateResource = async (values: {
    type: API.ClusterResourceCreateType;
    namespace?: string;
    manifest: Record<string, unknown>;
  }) => {
    setCreateLoading(true);
    try {
      await createClusterResource(values);
      message.success(`${createConfig?.title || title}已创建`);
      setCreateOpen(false);
      setInternalReloadKey((key) => key + 1);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <PageContainer title={title}>
      <ProTable<T>
        rowKey={rowKey}
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
          const res = await request({
            keyword: normalizeOptionalText(keywordRef.current),
            namespace: namespaceRef.current,
          });
          const allItems = res.data.items || [];

          return {
            data: allItems.slice((current - 1) * pageSize, current * pageSize),
            success: true,
            total: allItems.length,
          };
        }}
        headerTitle={
          <Space className={styles.toolbar}>
            {(onCreate || createConfig || renderCreateDrawer) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  if (onCreate) {
                    onCreate(namespaceRef.current);
                    return;
                  }
                  setCreateOpen(true);
                }}
              >
                {createButtonText}
              </Button>
            )}
            {showNamespaceFilter && (
              <Select<string>
                className={styles.namespaceSelect}
                value={namespaceValue}
                options={[
                  {
                    label: '全部命名空间',
                    value: ALL_NAMESPACES_VALUE,
                  },
                  ...namespaceOptions,
                ]}
                placeholder="选择命名空间"
                onChange={(value) => {
                  namespaceRef.current =
                    value === ALL_NAMESPACES_VALUE ? undefined : value;
                  setNamespaceValue(value);
                  actionRef.current?.reloadAndRest?.();
                }}
              />
            )}
            <ClusterTableSearch
              clearTriggersSearch
              style={{ width: 260 }}
              placeholder={searchPlaceholder || `搜索${title}名称`}
              onSearch={(value) => {
                keywordRef.current = value;
                actionRef.current?.reloadAndRest?.();
              }}
            />
          </Space>
        }
      />
      {renderCreateDrawer ? (
        renderCreateDrawer({
          defaultNamespace: namespaceRef.current,
          loading: createLoading,
          namespaceOptions,
          open: createOpen,
          onCancel: () => setCreateOpen(false),
          onSubmit: handleCreateResource,
        })
      ) : (
        <CreateResourceYamlDrawer
          config={createConfig}
          defaultNamespace={namespaceRef.current}
          loading={createLoading}
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          onSubmit={handleCreateResource}
        />
      )}
    </PageContainer>
  );
};

export type { CreateResourceConfig };
export default ClusterResourceListPage;
