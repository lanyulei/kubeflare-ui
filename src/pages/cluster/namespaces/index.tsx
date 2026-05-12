import {
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Link, useIntl } from '@umijs/max';
import { App, Button, Input, Popconfirm, Space } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';
import {
  createClusterNamespace,
  deleteClusterNamespace,
  getClusterNamespaceList,
} from '@/services/kubeflare/cluster/namespace';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';
const DEFAULT_PAGE_SIZE = 10;

const useStyles = createStyles(({ token }) => ({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
  },
  namespaceName: {
    color: token.colorText,
    // fontWeight: token.fontWeightStrong,
    lineHeight: token.lineHeight,
  },
  namespaceNameLink: {
    color: token.colorText,
    // fontWeight: token.fontWeightStrong,
    lineHeight: token.lineHeight,

    '&:hover': {
      color: token.colorPrimary,
    },
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
  statusDotSuccess: {
    backgroundColor: token.colorSuccess,
    boxShadow: `0 0 0 3px ${token.colorSuccessBg}`,
  },
  statusDotWarning: {
    backgroundColor: token.colorWarning,
    boxShadow: `0 0 0 3px ${token.colorWarningBg}`,
  },
}));

const namespaceNameRules = [
  {
    required: true,
    message: '请输入命名空间名称',
  },
  {
    min: 1,
    max: 63,
    message: '命名空间名称长度需在 1 到 63 位之间',
  },
  {
    pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
    message: '命名空间名称仅支持小写字母、数字和中划线',
  },
];

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const getNamespaceStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'active') {
    return '活跃';
  }
  if (normalizedStatus === 'terminating') {
    return '删除中';
  }
  return status || '-';
};

const getNamespaceStatusType = (
  status?: string,
): 'default' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'active') {
    return 'success';
  }
  if (normalizedStatus === 'terminating') {
    return 'warning';
  }
  return 'default';
};

const Namespaces = () => {
  const intl = useIntl();
  const { message } = App.useApp();
  const { styles } = useStyles();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const continueTokenRef = useRef<Record<number, string>>({ 1: '' });
  const pageSizeRef = useRef(DEFAULT_PAGE_SIZE);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };

  useEffect(() => {
    const reloadNamespaces = () => {
      continueTokenRef.current = { 1: '' };
      actionRef.current?.reloadAndRest?.();
    };

    window.addEventListener(CURRENT_CLUSTER_CHANGE_EVENT, reloadNamespaces);
    return () => {
      window.removeEventListener(
        CURRENT_CLUSTER_CHANGE_EVENT,
        reloadNamespaces,
      );
    };
  }, []);

  const columns: ProColumns<API.ClusterNamespaceItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.cluster.namespaces.name',
        defaultMessage: '名称',
      }),
      dataIndex: 'name',
      render: (_, record) =>
        record.name ? (
          <Link
            className={styles.namespaceNameLink}
            to={`/cluster/namespaces/detail/${encodeURIComponent(record.name)}`}
          >
            {record.name}
          </Link>
        ) : (
          <span className={styles.namespaceName}>-</span>
        ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.namespaces.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      // width: 120,
      render: (_, record) => {
        const statusType = getNamespaceStatusType(record.status);

        return (
          <span className={styles.status}>
            <span
              className={[
                styles.statusDot,
                statusDotClassNames[statusType],
              ].join(' ')}
            />
            <span>{getNamespaceStatusLabel(record.status)}</span>
          </span>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.namespaces.option',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      key: 'option',
      width: 120,
      render: (_, record) => [
        <Popconfirm
          key="delete"
          title={intl.formatMessage({
            id: 'pages.cluster.namespaces.delete.confirm',
            defaultMessage: '确认删除该命名空间吗？',
          })}
          onConfirm={async () => {
            await deleteClusterNamespace(record.name);
            message.success(
              intl.formatMessage({
                id: 'pages.cluster.namespaces.delete.success',
                defaultMessage: '命名空间已删除',
              }),
            );
            continueTokenRef.current = { 1: '' };
            actionRef.current?.reloadAndRest?.();
          }}
        >
          <a>
            <DeleteOutlined />{' '}
            {intl.formatMessage({
              id: 'pages.cluster.namespaces.delete',
              defaultMessage: '删除',
            })}
          </a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.cluster.clusterNamespaces',
        defaultMessage: '命名空间',
      })}
    >
      <ProTable<API.ClusterNamespaceItem>
        rowKey="name"
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
          const keyword = normalizeOptionalText(keywordRef.current);

          if (pageSizeRef.current !== pageSize) {
            pageSizeRef.current = pageSize;
            continueTokenRef.current = { 1: '' };
          }

          if (keyword) {
            const res = await getClusterNamespaceList({ keyword });
            const allItems = res.data.items || [];

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
          const res = await getClusterNamespaceList({
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
        headerTitle={
          <Space className={styles.toolbar}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateVisible(true)}
            >
              {intl.formatMessage({
                id: 'pages.cluster.namespaces.create',
                defaultMessage: '新建',
              })}
            </Button>
            <Input
              allowClear
              value={keywordDraft}
              suffix={<SearchOutlined />}
              style={{ width: 260 }}
              placeholder={intl.formatMessage({
                id: 'pages.cluster.namespaces.search.placeholder',
                defaultMessage: '搜索命名空间名称',
              })}
              onChange={(event) => {
                setKeywordDraft(event.target.value);
              }}
              onPressEnter={(event) => {
                keywordRef.current = event.currentTarget.value.trim();
                continueTokenRef.current = { 1: '' };
                actionRef.current?.reloadAndRest?.();
              }}
            />
          </Space>
        }
      />

      <ModalForm<API.CreateClusterNamespaceParams>
        title={intl.formatMessage({
          id: 'pages.cluster.namespaces.create',
          defaultMessage: '新建',
        })}
        open={createVisible}
        width={520}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setCreateVisible(false),
        }}
        onFinish={async (values) => {
          await createClusterNamespace({
            name: values.name.trim(),
          });
          message.success(
            intl.formatMessage({
              id: 'pages.cluster.namespaces.create.success',
              defaultMessage: '命名空间创建成功',
            }),
          );
          setCreateVisible(false);
          continueTokenRef.current = { 1: '' };
          actionRef.current?.reloadAndRest?.();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label={intl.formatMessage({
            id: 'pages.cluster.namespaces.name',
            defaultMessage: '名称',
          })}
          rules={namespaceNameRules}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default Namespaces;
