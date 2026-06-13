import {
  DeleteOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Link, useIntl } from '@umijs/max';
import type { TableProps } from 'antd';
import {
  App,
  Button,
  Drawer,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
} from 'antd';
import { createStyles } from 'antd-style';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { stringify } from 'yaml';
import { ClusterTableSearch, YamlEditor } from '@/components';
import { getClusterNamespaceList } from '@/services/kubeflare/cluster/namespace';
import {
  createClusterResource,
  deleteClusterResource,
  getClusterResourceManifest,
} from '@/services/kubeflare/cluster/resource';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import CreateResourceYamlDrawer, {
  type CreateResourceConfig,
} from './CreateResourceYamlDrawer';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';
const DEFAULT_PAGE_SIZE = 10;
const KEYWORD_SEARCH_PAGE_SIZE = 500;
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
  yamlDrawerBody: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
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

type ClusterResourceListPageProps<
  T extends { id?: string; name: string; namespace?: string },
> = {
  titleId: string;
  defaultTitle: string;
  columns: ProColumns<T>[];
  rowKey?: string | ((record: T) => string);
  tableScroll?: TableProps<T>['scroll'];
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
  resourceType?: API.ClusterResourceCreateType;
  resourceTypeName?: string;
  searchPlaceholder?: string;
  showNamespaceFilter?: boolean;
  extraContent?: ReactNode;
  onCreate?: (namespace?: string) => void;
  request: (
    params?: API.ClusterResourceListParams,
  ) => Promise<API.ApiResponse<API.ClusterResourceListData<T>>>;
};

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const getResourceRecordKey = <
  T extends { id?: string; name: string; namespace?: string },
>(
  record: T,
) => record.id || `${record.namespace || '-'}/${record.name}`;

const getPagedTotal = (
  current: number,
  pageSize: number,
  itemCount: number,
  hasNextPage: boolean,
) => (current - 1) * pageSize + itemCount + (hasNextPage ? pageSize : 0);

const getCreateErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const errorRecord =
    error && typeof error === 'object'
      ? (error as {
          info?: { message?: string };
          response?: { data?: { message?: string } };
        })
      : undefined;

  return (
    errorRecord?.info?.message ||
    errorRecord?.response?.data?.message ||
    '创建失败，请稍后重试'
  );
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

const ClusterResourceListPage = <
  T extends { id?: string; name: string; namespace?: string },
>({
  titleId,
  defaultTitle,
  columns,
  rowKey,
  tableScroll,
  createButtonText = '新建',
  createConfig,
  extraContent,
  renderCreateDrawer,
  reloadKey,
  resourceType,
  resourceTypeName = '资源',
  searchPlaceholder,
  showNamespaceFilter = false,
  onCreate,
  request,
}: ClusterResourceListPageProps<T>) => {
  const intl = useIntl();
  const { message, modal } = App.useApp();
  const { styles } = useStyles();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const namespaceRef = useRef<string | undefined>(undefined);
  const continueTokenRef = useRef<Record<number, string>>({ 1: '' });
  const pageSizeRef = useRef(DEFAULT_PAGE_SIZE);
  const requestSignatureRef = useRef('');
  const [namespaceValue, setNamespaceValue] = useState(ALL_NAMESPACES_VALUE);
  const [namespaceOptions, setNamespaceOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [yamlOpen, setYamlOpen] = useState(false);
  const [yamlLoading, setYamlLoading] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const [yamlTitle, setYamlTitle] = useState('查看 YAML');
  const [deleteLoadingKey, setDeleteLoadingKey] = useState<string>();
  const title = intl.formatMessage({
    id: titleId,
    defaultMessage: defaultTitle,
  });

  const resetContinuePagination = useCallback(() => {
    continueTokenRef.current = { 1: '' };
  }, []);

  const reloadTableFromFirstPage = useCallback(() => {
    resetContinuePagination();
    actionRef.current?.reloadAndRest?.();
  }, [resetContinuePagination]);

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
      resetContinuePagination();
      loadNamespaceOptions();
      actionRef.current?.reloadAndRest?.();
    };

    loadNamespaceOptions();
    window.addEventListener(CURRENT_CLUSTER_CHANGE_EVENT, reloadResources);
    return () => {
      window.removeEventListener(CURRENT_CLUSTER_CHANGE_EVENT, reloadResources);
    };
  }, [loadNamespaceOptions, resetContinuePagination]);

  useEffect(() => {
    if (reloadKey === undefined) {
      return;
    }

    reloadTableFromFirstPage();
  }, [reloadKey, reloadTableFromFirstPage]);

  const handleCreateResource = async (values: {
    type: API.ClusterResourceCreateType;
    namespace?: string;
    manifest: Record<string, unknown>;
  }) => {
    setCreateLoading(true);
    try {
      await createClusterResource(values, {
        skipErrorHandler: true,
      });
      message.success(`${createConfig?.title || title}已创建`);
      setCreateOpen(false);
      reloadTableFromFirstPage();
    } catch (error) {
      message.error(getCreateErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreateDrawer = useCallback(() => {
    const createWarning = createConfig?.createWarning;
    if (!createWarning) {
      setCreateOpen(true);
      return;
    }

    modal.confirm({
      title: createWarning.title,
      content: createWarning.description,
      okText: createWarning.okText || '继续创建',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => setCreateOpen(true),
    });
  }, [createConfig?.createWarning, modal]);

  const getResourceParams = useCallback(
    (record: T): API.ClusterResourceDetailParams | undefined => {
      if (!resourceType || !record.name) {
        return undefined;
      }

      return {
        type: resourceType,
        namespace: record.namespace,
        name: record.name,
      };
    },
    [resourceType],
  );

  const handleViewYaml = useCallback(
    async (record: T) => {
      const params = getResourceParams(record);

      if (!params) {
        return;
      }

      setYamlOpen(true);
      setYamlLoading(true);
      setYamlTitle(`${record.name} YAML`);
      setYamlValue('');

      try {
        const res = await getClusterResourceManifest(params);
        setYamlValue(stringify(res.data || {}, { indent: 2 }));
      } catch (error) {
        message.error(getCreateErrorMessage(error));
      } finally {
        setYamlLoading(false);
      }
    },
    [getResourceParams, message],
  );

  const handleDeleteResource = useCallback(
    async (record: T) => {
      const params = getResourceParams(record);

      if (!params) {
        return;
      }

      setDeleteLoadingKey(getResourceRecordKey(record));
      try {
        await deleteClusterResource(params, {
          skipErrorHandler: true,
        });
        message.success(`${resourceTypeName}已删除`);
        reloadTableFromFirstPage();
      } catch (error) {
        message.error(getCreateErrorMessage(error));
      } finally {
        setDeleteLoadingKey(undefined);
      }
    },
    [getResourceParams, message, reloadTableFromFirstPage, resourceTypeName],
  );

  const tableColumns = useMemo<ProColumns<T>[]>(() => {
    const nextColumns: ProColumns<T>[] = resourceType
      ? [
          ...columns,
          {
            title: '操作',
            valueType: 'option',
            key: 'option',
            width: 150,
            fixed: 'right',
            render: (_, record) => [
              <a
                key="yaml"
                onClick={() => {
                  handleViewYaml(record);
                }}
              >
                <FileTextOutlined /> YAML
              </a>,
              <Popconfirm
                key="delete"
                title={`确认删除该${resourceTypeName}吗？`}
                description="删除后资源将从当前集群移除，请谨慎操作。"
                okText="删除"
                okButtonProps={{
                  danger: true,
                  loading: deleteLoadingKey === getResourceRecordKey(record),
                }}
                cancelText="取消"
                onConfirm={() => handleDeleteResource(record)}
              >
                <a>
                  <DeleteOutlined /> 删除
                </a>
              </Popconfirm>,
            ],
          },
        ]
      : columns;

    return withComfortableTableColumns(nextColumns);
  }, [
    columns,
    deleteLoadingKey,
    handleDeleteResource,
    handleViewYaml,
    resourceType,
    resourceTypeName,
  ]);
  const scroll = useMemo(
    () => getComfortableTableScroll(tableColumns, tableScroll),
    [tableColumns, tableScroll],
  );
  const tableRowKey = useMemo(
    () => rowKey || ((record: T) => getResourceRecordKey(record)),
    [rowKey],
  );

  return (
    <PageContainer title={title}>
      {extraContent}
      <ProTable<T>
        rowKey={tableRowKey}
        actionRef={actionRef}
        search={false}
        columns={tableColumns}
        scroll={scroll}
        pagination={{
          defaultPageSize: DEFAULT_PAGE_SIZE,
          showSizeChanger: true,
        }}
        request={async (params) => {
          const current = params.current || 1;
          const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
          const keyword = normalizeOptionalText(keywordRef.current);
          const requestSignature = [
            keyword || '',
            namespaceRef.current || '',
          ].join('\n');

          if (
            pageSizeRef.current !== pageSize ||
            requestSignatureRef.current !== requestSignature
          ) {
            pageSizeRef.current = pageSize;
            requestSignatureRef.current = requestSignature;
            resetContinuePagination();
          }

          if (keyword) {
            const allItems: T[] = [];
            let searchContinueToken: string | undefined;

            do {
              const res = await request({
                keyword,
                namespace: namespaceRef.current,
                limit: KEYWORD_SEARCH_PAGE_SIZE,
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
          const res = await request({
            namespace: namespaceRef.current,
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
            {(onCreate || createConfig || renderCreateDrawer) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  if (onCreate) {
                    onCreate(namespaceRef.current);
                    return;
                  }
                  openCreateDrawer();
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
                  reloadTableFromFirstPage();
                }}
              />
            )}
            <ClusterTableSearch
              clearTriggersSearch
              style={{ width: 260 }}
              placeholder={searchPlaceholder || `搜索${title}名称`}
              onSearch={(value) => {
                keywordRef.current = value;
                reloadTableFromFirstPage();
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
      <Drawer
        destroyOnHidden
        open={yamlOpen}
        title={yamlTitle}
        width="65vw"
        onClose={() => setYamlOpen(false)}
      >
        <Spin spinning={yamlLoading}>
          <div className={styles.yamlDrawerBody}>
            <YamlEditor
              height="calc(100vh - 116px)"
              readOnly
              value={yamlValue}
            />
          </div>
        </Spin>
      </Drawer>
    </PageContainer>
  );
};

export type { CreateResourceConfig };
export default ClusterResourceListPage;
