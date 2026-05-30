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
      ellipsis: true,
      renderText: (_, record) => record.namespace || '-',
    },
    {
      title: '目标工作负载',
      dataIndex: 'target_name',
      ellipsis: true,
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
      ellipsis: true,
      renderText: (_, record) => record.update_mode || '-',
    },
    {
      title: '资源建议',
      dataIndex: 'recommendation',
      ellipsis: true,
      renderText: (_, record) => record.recommendation || '-',
    },
    createStatusColumn<API.ClusterVerticalPodAutoscalerItem>('状态', {
      ellipsis: true,
      width: 140,
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
