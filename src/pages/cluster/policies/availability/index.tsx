import type { ProColumns } from '@ant-design/pro-components';
import { getClusterPodDisruptionBudgetList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  createStatusColumn,
  renderFallbackText,
} from '../../resource';
import CreatePodDisruptionBudgetDrawer from '../components/CreatePodDisruptionBudgetDrawer';

const PodDisruptionBudgets = () => {
  const columns: ProColumns<API.ClusterPodDisruptionBudgetItem>[] = [
    createResourceNameColumn<API.ClusterPodDisruptionBudgetItem>(
      'PodDisruptionBudget',
    ),
    {
      title: '命名空间',
      dataIndex: 'namespace',
      ellipsis: true,
      renderText: (_, record) => record.namespace || '-',
    },
    {
      title: '保护策略',
      dataIndex: 'min_available',
      ellipsis: true,
      render: (_, record) =>
        renderFallbackText(
          record.min_available
            ? `至少 ${record.min_available} 个可用`
            : record.max_unavailable
              ? `最多 ${record.max_unavailable} 个不可用`
              : undefined,
        ),
    },
    {
      title: '允许中断',
      dataIndex: 'allowed_disruptions',
      ellipsis: true,
      renderText: (_, record) => record.allowed_disruptions ?? '-',
    },
    {
      title: '健康/期望',
      dataIndex: 'current_healthy',
      ellipsis: true,
      render: (_, record) =>
        `${record.current_healthy ?? '-'} / ${record.desired_healthy ?? '-'}`,
    },
    {
      title: '选择器',
      dataIndex: 'selector',
      ellipsis: true,
      renderText: (_, record) => record.selector || '-',
    },
    createStatusColumn<API.ClusterPodDisruptionBudgetItem>('状态', {
      ellipsis: true,
      width: 120,
    }),
    {
      title: '创建时间',
      dataIndex: 'create_time',
      ellipsis: true,
      valueType: 'dateTime',
      width: 180,
    },
  ];

  return (
    <ClusterResourceListPage<API.ClusterPodDisruptionBudgetItem>
      titleId="menu.cluster.clusterPolicies.clusterPoliciesAvailability"
      defaultTitle="可用性保护"
      columns={columns}
      createButtonText="新建保护策略"
      renderCreateDrawer={(props) => (
        <CreatePodDisruptionBudgetDrawer {...props} />
      )}
      request={getClusterPodDisruptionBudgetList}
      searchPlaceholder="搜索策略名称 / 选择器"
      showNamespaceFilter
    />
  );
};

export default PodDisruptionBudgets;
