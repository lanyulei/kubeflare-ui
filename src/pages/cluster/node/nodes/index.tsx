import { SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Link, useIntl } from '@umijs/max';
import { Input } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';
import { getClusterNodeList } from '@/services/kubeflare/cluster/node';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';
const DEFAULT_PAGE_SIZE = 10;

const useStyles = createStyles(({ token }) => ({
  nodeName: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  nodeNameText: {
    color: token.colorText,
    fontWeight: token.fontWeightStrong,
    lineHeight: token.lineHeight,
  },
  nodeNameLink: {
    color: token.colorText,
    fontWeight: token.fontWeightStrong,
    lineHeight: token.lineHeight,

    '&:hover': {
      color: token.colorPrimary,
    },
  },
  nodeIp: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
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

const getNodeStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'ready') {
    return '运行中';
  }
  if (normalizedStatus === 'notready') {
    return '异常';
  }
  if (normalizedStatus === 'unknown') {
    return '未知';
  }
  if (normalizedStatus === 'schedulingdisabled') {
    return '已禁止调度';
  }
  return status || '-';
};

const getNodeStatusType = (
  status?: string,
): 'default' | 'error' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'ready') {
    return 'success';
  }
  if (normalizedStatus === 'notready' || normalizedStatus === 'unknown') {
    return 'error';
  }
  if (normalizedStatus === 'schedulingdisabled') {
    return 'warning';
  }
  return 'default';
};

const getNodeIp = (record: API.ClusterNodeItem) =>
  record.ip || record.internal_ip || record.external_ip || '-';

const getNodeVersion = (record: API.ClusterNodeItem) =>
  record.version || record.kubelet_version || '-';

const getNodeRoles = (roles?: string[] | string) => {
  if (Array.isArray(roles)) {
    return roles;
  }
  if (roles) {
    return roles
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);
  }
  return [];
};

const getNodeRoleLabel = (role: string) => {
  const normalizedRole = role.trim().toLowerCase();

  if (normalizedRole === 'control-plane' || normalizedRole === 'master') {
    return '控制平面节点';
  }
  if (normalizedRole === 'worker') {
    return '工作节点';
  }
  return role;
};

const ClusterNodes = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const continueTokenRef = useRef<Record<number, string>>({ 1: '' });
  const pageSizeRef = useRef(DEFAULT_PAGE_SIZE);
  const [keywordDraft, setKeywordDraft] = useState('');
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    error: styles.statusDotError,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };

  useEffect(() => {
    const reloadNodes = () => {
      continueTokenRef.current = { 1: '' };
      actionRef.current?.reloadAndRest?.();
    };

    window.addEventListener(CURRENT_CLUSTER_CHANGE_EVENT, reloadNodes);
    return () => {
      window.removeEventListener(CURRENT_CLUSTER_CHANGE_EVENT, reloadNodes);
    };
  }, []);

  const columns: ProColumns<API.ClusterNodeItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodes.name',
        defaultMessage: '名称',
      }),
      dataIndex: 'name',
      render: (_, record) => (
        <div className={styles.nodeName}>
          {record.name ? (
            <Link
              className={styles.nodeNameLink}
              to={`/cluster/node/detail/${encodeURIComponent(record.name)}`}
            >
              {record.name}
            </Link>
          ) : (
            <span className={styles.nodeNameText}>-</span>
          )}
          <span className={styles.nodeIp}>{getNodeIp(record)}</span>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodes.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      width: 120,
      render: (_, record) => {
        const statusType = getNodeStatusType(record.status);

        return (
          <span className={styles.status}>
            <span
              className={[
                styles.statusDot,
                statusDotClassNames[statusType],
              ].join(' ')}
            />
            <span>{getNodeStatusLabel(record.status)}</span>
          </span>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodes.roles',
        defaultMessage: '角色',
      }),
      dataIndex: 'roles',
      render: (_, record) => {
        const roles = getNodeRoles(record.roles);
        if (!roles.length) {
          return '-';
        }
        return roles.map(getNodeRoleLabel).join('、');
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodes.uptime',
        defaultMessage: '运行时间',
      }),
      dataIndex: 'uptime',
      width: 160,
      renderText: (_, record) => record.uptime || record.age || '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.cluster.nodes.version',
        defaultMessage: '版本',
      }),
      dataIndex: 'version',
      ellipsis: true,
      renderText: (_, record) => getNodeVersion(record),
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'pages.cluster.nodes.title',
        defaultMessage: '集群节点',
      })}
    >
      <ProTable<API.ClusterNodeItem>
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

          if (pageSizeRef.current !== pageSize) {
            pageSizeRef.current = pageSize;
            continueTokenRef.current = { 1: '' };
          }

          const continueToken = continueTokenRef.current[current] || '';
          const res = await getClusterNodeList({
            keyword: normalizeOptionalText(keywordRef.current),
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
          <Input
            allowClear
            value={keywordDraft}
            suffix={<SearchOutlined />}
            style={{ width: 260 }}
            placeholder={intl.formatMessage({
              id: 'pages.cluster.nodes.search.placeholder',
              defaultMessage: '搜索节点名称 / IP 地址',
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
        }
      />
    </PageContainer>
  );
};

export default ClusterNodes;
