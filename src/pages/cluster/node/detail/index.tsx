import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Empty, Spin } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { getClusterNodeList } from '@/services/kubeflare/cluster/node';

const useStyles = createStyles(({ token }) => ({
  content: {
    backgroundColor: token.colorBgContainer,
    border: `1px solid ${token.colorBorder}80`,
    borderRadius: token.borderRadiusLG,
    padding: token.paddingLG,
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
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
  },
  statusDotError: {
    backgroundColor: token.colorError,
  },
  statusDotSuccess: {
    backgroundColor: token.colorSuccess,
  },
  statusDotWarning: {
    backgroundColor: token.colorWarning,
  },
}));

const getNodeIp = (record?: API.ClusterNodeItem) =>
  record?.ip || record?.internal_ip || record?.external_ip || '-';

const getNodeVersion = (record?: API.ClusterNodeItem) =>
  record?.version || record?.kubelet_version || '-';

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

const formatCreateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : value;
};

const decodeNodeName = (name?: string) => {
  if (!name) {
    return '';
  }

  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};

const ClusterNodeDetail = () => {
  const { styles } = useStyles();
  const params = useParams<{ name?: string }>();
  const nodeName = useMemo(() => decodeNodeName(params.name), [params.name]);
  const [loading, setLoading] = useState(false);
  const [node, setNode] = useState<API.ClusterNodeItem>();

  useEffect(() => {
    let mounted = true;

    const fetchNode = async () => {
      setLoading(true);
      const res = await getClusterNodeList({ keyword: nodeName });
      const items = res.data.items || [];
      const nextNode =
        items.find((item) => item.name === nodeName) ||
        items.find((item) => item.name?.includes(nodeName));

      if (mounted) {
        setNode(nextNode);
        setLoading(false);
      }
    };

    if (nodeName) {
      fetchNode();
    }

    return () => {
      mounted = false;
    };
  }, [nodeName]);

  const roles =
    getNodeRoles(node?.roles).map(getNodeRoleLabel).join('、') || '-';
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    error: styles.statusDotError,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };

  return (
    <PageContainer title={nodeName || '节点详情'} onBack={() => history.back()}>
      <div className={styles.content}>
        <Spin spinning={loading}>
          {node ? (
            <ProDescriptions<API.ClusterNodeItem>
              column={3}
              dataSource={node}
              columns={[
                {
                  title: '状态',
                  dataIndex: 'status',
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
                  title: 'IP 地址',
                  renderText: (_, record) => getNodeIp(record),
                },
                {
                  title: '角色',
                  dataIndex: 'roles',
                  renderText: () => roles,
                },
                {
                  title: '操作系统版本',
                  dataIndex: 'os_image',
                  renderText: (_, record) => record.os_image || '-',
                },
                {
                  title: '操作系统类型',
                  dataIndex: 'operating_system',
                  renderText: (_, record) => record.operating_system || '-',
                },
                {
                  title: '内核版本',
                  dataIndex: 'kernel_version',
                  renderText: (_, record) => record.kernel_version || '-',
                },
                {
                  title: '容器运行时',
                  dataIndex: 'container_runtime_version',
                  renderText: (_, record) =>
                    record.container_runtime_version || '-',
                },
                {
                  title: 'kubelet 版本',
                  dataIndex: 'kubelet_version',
                  renderText: (_, record) => getNodeVersion(record),
                },
                {
                  title: 'kube-proxy 版本',
                  dataIndex: 'kube_proxy_version',
                  renderText: (_, record) => record.kube_proxy_version || '-',
                },
                {
                  title: '系统架构',
                  dataIndex: 'architecture',
                  renderText: (_, record) => record.architecture || '-',
                },
                {
                  title: '创建时间',
                  dataIndex: 'create_time',
                  renderText: (_, record) =>
                    formatCreateTime(record.create_time),
                },
              ]}
            />
          ) : (
            <Empty description={loading ? '加载中' : '未找到节点'} />
          )}
        </Spin>
      </div>
    </PageContainer>
  );
};

export default ClusterNodeDetail;
