import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Button, Empty, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { getClusterNodeList } from '@/services/kubeflare/cluster/node';

const useStyles = createStyles(({ token }) => ({
  content: {
    backgroundColor: token.colorBgContainer,
    borderRadius: token.borderRadiusLG,
    padding: token.paddingLG,
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

  return (
    <PageContainer
      title={nodeName || '节点详情'}
      onBack={() => history.back()}
      extra={
        <Button onClick={() => history.push('/cluster/node/list')}>
          返回列表
        </Button>
      }
    >
      <div className={styles.content}>
        <Spin spinning={loading}>
          {node ? (
            <ProDescriptions<API.ClusterNodeItem>
              column={2}
              dataSource={node}
              columns={[
                {
                  title: '名称',
                  dataIndex: 'name',
                },
                {
                  title: 'IP 地址',
                  renderText: (_, record) => getNodeIp(record),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  renderText: (_, record) => getNodeStatusLabel(record.status),
                },
                {
                  title: '角色',
                  dataIndex: 'roles',
                  renderText: () => roles,
                },
                {
                  title: '运行时间',
                  dataIndex: 'uptime',
                  renderText: (_, record) => record.uptime || record.age || '-',
                },
                {
                  title: '版本',
                  dataIndex: 'version',
                  renderText: (_, record) => getNodeVersion(record),
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
