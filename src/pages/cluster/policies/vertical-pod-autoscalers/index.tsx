import type { ProColumns } from '@ant-design/pro-components';
import { getClusterVerticalPodAutoscalerList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  createStatusColumn,
  renderFallbackText,
} from '../../resource';
import CreateVerticalPodAutoscalerDrawer from '../components/CreateVerticalPodAutoscalerDrawer';

const VerticalPodAutoscalers = () => {
  const columns: ProColumns<API.ClusterVerticalPodAutoscalerItem>[] = [
    createResourceNameColumn<API.ClusterVerticalPodAutoscalerItem>(
      'VerticalPodAutoscaler',
    ),
    {
      title: '命名空间',
      dataIndex: 'namespace',
      renderText: (_, record) => record.namespace || '-',
    },
    {
      title: '目标工作负载',
      dataIndex: 'target_name',
      render: (_, record) =>
        renderFallbackText(
          record.target_name
            ? `${record.target_kind || '-'} / ${record.target_name}`
            : undefined,
        ),
    },
    {
      title: '更新模式',
      dataIndex: 'update_mode',
      renderText: (_, record) => record.update_mode || '-',
    },
    {
      title: '资源建议',
      dataIndex: 'recommendation',
      renderText: (_, record) => record.recommendation || '-',
    },
    createStatusColumn<API.ClusterVerticalPodAutoscalerItem>('状态', {
      width: 140,
    }),
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

  return (
    <ClusterResourceListPage<API.ClusterVerticalPodAutoscalerItem>
      titleId="menu.cluster.clusterPolicies.clusterPoliciesVerticalPodAutoscalers"
      defaultTitle="资源建议"
      columns={columns}
      createButtonText="新建资源建议"
      renderCreateDrawer={(props) => (
        <CreateVerticalPodAutoscalerDrawer {...props} />
      )}
      request={getClusterVerticalPodAutoscalerList}
      searchPlaceholder="搜索策略名称 / 目标工作负载"
      showNamespaceFilter
    />
  );
};

export default VerticalPodAutoscalers;
