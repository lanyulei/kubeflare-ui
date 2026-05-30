import { ProDescriptions } from '@ant-design/pro-components';
import { Empty, Spin } from 'antd';
import { KubernetesCompatibilityNotice, SectionTitle } from '@/components';
import {
  formatCreateTime,
  getNodeIp,
  getNodeRoleLabel,
  getNodeRoles,
  getNodeStatusLabel,
  getNodeStatusType,
  getNodeVersion,
} from '../helpers';
import useStyles from '../styles';

type BasicInfoProps = {
  loading: boolean;
  node?: API.ClusterNodeItem;
};

const getNodeCompatibilityItems = (node?: API.ClusterNodeItem) => {
  if (!node) {
    return [];
  }

  const items: string[] = [];
  const runtimeVersion = node.container_runtime_version || '';

  if (/containerd:\/\/1\./.test(runtimeVersion)) {
    items.push(
      '当前节点仍使用 containerd 1.x；Kubernetes 1.35 是 containerd 1.x 的最后支持版本，后续升级应规划 containerd 2.x。',
    );
  }

  if (!node.kube_proxy_version || node.kube_proxy_version === '-') {
    items.push(
      '未获取到 kube-proxy 版本；升级到 Kubernetes 1.35+ 前建议确认 kube-proxy 模式，IPVS 模式已进入弃用周期。',
    );
  }

  return items;
};

const BasicInfo = ({ loading, node }: BasicInfoProps) => {
  const { styles } = useStyles();
  const roles =
    getNodeRoles(node?.roles).map(getNodeRoleLabel).join('、') || '-';
  const compatibilityItems = getNodeCompatibilityItems(node);
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    error: styles.statusDotError,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };

  return (
    <div>
      <SectionTitle>基本信息</SectionTitle>
      <div className={styles.content}>
        <Spin spinning={loading}>
          {node ? (
            <>
              <KubernetesCompatibilityNotice
                message="Kubernetes 1.35+ 节点兼容性关注项"
                type={compatibilityItems.length > 0 ? 'warning' : 'info'}
                items={
                  compatibilityItems.length > 0
                    ? compatibilityItems
                    : [
                        'Kubernetes 1.35+ 升级前应确认节点已使用 cgroup v2，并规划 kube-proxy IPVS 与 containerd 1.x 的后续替换。',
                      ]
                }
              />
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
            </>
          ) : (
            <Empty description={loading ? '加载中' : '未找到节点'} />
          )}
        </Spin>
      </div>
    </div>
  );
};

export default BasicInfo;
