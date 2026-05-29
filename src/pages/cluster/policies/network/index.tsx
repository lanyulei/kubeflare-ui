import type { ProColumns } from '@ant-design/pro-components';
import { getClusterNetworkPolicyList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  renderTextList,
} from '../../resource';
import CreateNetworkPolicyDrawer from '../components/CreateNetworkPolicyDrawer';

const NetworkPolicies = () => {
  const columns: ProColumns<API.ClusterNetworkPolicyItem>[] = [
    createResourceNameColumn<API.ClusterNetworkPolicyItem>('NetworkPolicy'),
    {
      title: '命名空间',
      dataIndex: 'namespace',
      renderText: (_, record) => record.namespace || '-',
    },
    {
      title: '作用对象',
      dataIndex: 'pod_selector',
      ellipsis: true,
      renderText: (_, record) => record.pod_selector || '-',
    },
    {
      title: '策略方向',
      dataIndex: 'policy_types',
      render: (_, record) => renderTextList(record.policy_types),
    },
    {
      title: '入站规则',
      dataIndex: 'ingress_rules',
      render: (_, record) => `${record.ingress_rules ?? '-'}`,
    },
    {
      title: '出站规则',
      dataIndex: 'egress_rules',
      render: (_, record) => `${record.egress_rules ?? '-'}`,
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

  return (
    <ClusterResourceListPage<API.ClusterNetworkPolicyItem>
      titleId="menu.cluster.clusterPolicies.clusterPoliciesNetwork"
      defaultTitle="网络策略"
      columns={columns}
      createButtonText="新建网络策略"
      renderCreateDrawer={(props) => <CreateNetworkPolicyDrawer {...props} />}
      request={getClusterNetworkPolicyList}
      searchPlaceholder="搜索策略名称 / 作用对象"
      showNamespaceFilter
    />
  );
};

export default NetworkPolicies;
