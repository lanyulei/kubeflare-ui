import { getClusterNetworkPolicyList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  renderTextList,
} from '../../resource';
import { createNetworkPolicyConfig } from '../../resource/createConfigs';

const NetworkPolicies = () => (
  <ClusterResourceListPage<API.ClusterNetworkPolicyItem>
    titleId="menu.cluster.clusterNetwork.clusterNetworkPolicies"
    defaultTitle="网络策略"
    searchPlaceholder="搜索网络策略名称 / Pod 选择器 / 策略类型"
    showNamespaceFilter
    createConfig={createNetworkPolicyConfig}
    resourceType="NetworkPolicy"
    resourceTypeName="网络策略"
    request={getClusterNetworkPolicyList}
    columns={[
      createResourceNameColumn<API.ClusterNetworkPolicyItem>('NetworkPolicy'),
      {
        title: '命名空间',
        dataIndex: 'namespace',
        ellipsis: true,
        renderText: (_, record) => record.namespace || '-',
      },
      {
        title: 'Pod 选择器',
        dataIndex: 'pod_selector',
        ellipsis: true,
        renderText: (_, record) => record.pod_selector || '-',
      },
      {
        title: '策略类型',
        dataIndex: 'policy_types',
        width: 180,
        render: (_, record) => renderTextList(record.policy_types),
      },
      {
        title: '入站规则',
        dataIndex: 'ingress_rules',
        width: 110,
        renderText: (_, record) => record.ingress_rules ?? 0,
      },
      {
        title: '出站规则',
        dataIndex: 'egress_rules',
        width: 110,
        renderText: (_, record) => record.egress_rules ?? 0,
      },
      {
        title: '创建时间',
        dataIndex: 'create_time',
        valueType: 'dateTime',
        width: 180,
      },
    ]}
  />
);

export default NetworkPolicies;
