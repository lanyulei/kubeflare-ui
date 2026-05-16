import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Link, useIntl } from '@umijs/max';
import { Button, Input, Select, Space } from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getClusterNamespaceList } from '@/services/kubeflare/cluster/namespace';
import { getClusterWorkloadList } from '@/services/kubeflare/cluster/workload';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';
const DEFAULT_PAGE_SIZE = 10;
const ALL_NAMESPACES_VALUE = '__all__';

const WORKLOAD_TABS: {
  key: API.ClusterWorkloadType;
  labelId: string;
  label: string;
}[] = [
  {
    key: 'Deployment',
    labelId: 'pages.cluster.workloads.tabs.deployments',
    label: '部署',
  },
  {
    key: 'StatefulSet',
    labelId: 'pages.cluster.workloads.tabs.statefulsets',
    label: '有状态副本集',
  },
  {
    key: 'DaemonSet',
    labelId: 'pages.cluster.workloads.tabs.daemonsets',
    label: '守护进程集',
  },
];

const useStyles = createStyles(({ token }) => ({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
  },
  namespaceSelect: {
    width: 180,
  },
  workloadName: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  workloadNameText: {
    overflow: 'hidden',
    color: token.colorText,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',

    '&:hover': {
      color: token.colorPrimary,
    },
  },
  workloadNamespace: {
    overflow: 'hidden',
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
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

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const getWorkloadStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'running') {
    return '运行中';
  }
  if (normalizedStatus === 'updating') {
    return '更新中';
  }
  if (normalizedStatus === 'progressing') {
    return '启动中';
  }
  if (normalizedStatus === 'stopped') {
    return '已停止';
  }
  if (normalizedStatus === 'terminating') {
    return '删除中';
  }
  if (
    normalizedStatus === 'unavailable' ||
    normalizedStatus === 'minimumreplicasunavailable'
  ) {
    return '异常';
  }
  return status || '-';
};

const getWorkloadStatusType = (
  status?: string,
): 'default' | 'error' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'running') {
    return 'success';
  }
  if (
    normalizedStatus === 'updating' ||
    normalizedStatus === 'progressing' ||
    normalizedStatus === 'terminating'
  ) {
    return 'warning';
  }
  if (
    normalizedStatus === 'unavailable' ||
    normalizedStatus === 'minimumreplicasunavailable'
  ) {
    return 'error';
  }
  return 'default';
};

const Workloads = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const namespaceRef = useRef<string | undefined>(undefined);
  const activeWorkloadTypeRef = useRef<API.ClusterWorkloadType>('Deployment');
  const [keywordDraft, setKeywordDraft] = useState('');
  const [namespaceValue, setNamespaceValue] = useState(ALL_NAMESPACES_VALUE);
  const [namespaceOptions, setNamespaceOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [activeWorkloadType, setActiveWorkloadType] =
    useState<API.ClusterWorkloadType>('Deployment');
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    error: styles.statusDotError,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };

  const loadNamespaceOptions = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const reloadWorkloads = () => {
      namespaceRef.current = undefined;
      setNamespaceValue(ALL_NAMESPACES_VALUE);
      loadNamespaceOptions();
      actionRef.current?.reloadAndRest?.();
    };

    loadNamespaceOptions();
    window.addEventListener(CURRENT_CLUSTER_CHANGE_EVENT, reloadWorkloads);
    return () => {
      window.removeEventListener(CURRENT_CLUSTER_CHANGE_EVENT, reloadWorkloads);
    };
  }, [loadNamespaceOptions]);

  const columns: ProColumns<API.ClusterWorkloadItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.cluster.workloads.name',
        defaultMessage: '名称',
      }),
      dataIndex: 'name',
      ellipsis: true,
      render: (_, record) => (
        <div className={styles.workloadName}>
          {record.name && record.namespace ? (
            <Link
              className={styles.workloadNameText}
              to={`/cluster/workloads/detail/${encodeURIComponent(
                record.type,
              )}/${encodeURIComponent(record.namespace)}/${encodeURIComponent(
                record.name,
              )}`}
            >
              {record.name}
            </Link>
          ) : (
            <span className={styles.workloadNameText}>-</span>
          )}
          <span className={styles.workloadNamespace}>
            {record.namespace || '-'}
          </span>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.workloads.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      render: (_, record) => {
        const statusType = getWorkloadStatusType(record.status);

        return (
          <span className={styles.status}>
            <span
              className={[
                styles.statusDot,
                statusDotClassNames[statusType],
              ].join(' ')}
            />
            <span>{getWorkloadStatusLabel(record.status)}</span>
          </span>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.workloads.ready',
        defaultMessage: '就绪',
      }),
      dataIndex: 'ready',
      renderText: (_, record) => record.ready || '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.workloads.createTime',
        defaultMessage: '创建时间',
      }),
      dataIndex: 'create_time',
      valueType: 'dateTime',
      width: 180,
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.cluster.clusterWorkloads.clusterWorkloadsList',
        defaultMessage: '工作负载',
      })}
      tabActiveKey={activeWorkloadType}
      tabList={WORKLOAD_TABS.map((item) => ({
        key: item.key,
        tab: intl.formatMessage({
          id: item.labelId,
          defaultMessage: item.label,
        }),
      }))}
      onTabChange={(key) => {
        const nextWorkloadType = key as API.ClusterWorkloadType;
        activeWorkloadTypeRef.current = nextWorkloadType;
        setActiveWorkloadType(nextWorkloadType);
        actionRef.current?.reloadAndRest?.();
      }}
    >
      <ProTable<API.ClusterWorkloadItem>
        rowKey="id"
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
          const res = await getClusterWorkloadList({
            keyword: normalizeOptionalText(keywordRef.current),
            type: activeWorkloadTypeRef.current,
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
            <Button type="primary" icon={<PlusOutlined />}>
              {intl.formatMessage({
                id: 'pages.cluster.workloads.create',
                defaultMessage: '新建',
              })}
            </Button>
            <Select<string>
              className={styles.namespaceSelect}
              value={namespaceValue}
              options={[
                {
                  label: intl.formatMessage({
                    id: 'pages.cluster.workloads.namespace.all',
                    defaultMessage: '全部命名空间',
                  }),
                  value: ALL_NAMESPACES_VALUE,
                },
                ...namespaceOptions,
              ]}
              placeholder={intl.formatMessage({
                id: 'pages.cluster.workloads.namespace.placeholder',
                defaultMessage: '选择命名空间',
              })}
              onChange={(value) => {
                namespaceRef.current =
                  value === ALL_NAMESPACES_VALUE ? undefined : value;
                setNamespaceValue(value);
                actionRef.current?.reloadAndRest?.();
              }}
            />
            <Input
              allowClear
              value={keywordDraft}
              suffix={<SearchOutlined />}
              style={{ width: 260 }}
              placeholder={intl.formatMessage({
                id: 'pages.cluster.workloads.search.placeholder',
                defaultMessage: '搜索工作负载名称',
              })}
              onChange={(event) => {
                setKeywordDraft(event.target.value);
              }}
              onPressEnter={(event) => {
                keywordRef.current = event.currentTarget.value.trim();
                actionRef.current?.reloadAndRest?.();
              }}
            />
          </Space>
        }
      />
    </PageContainer>
  );
};

export default Workloads;
