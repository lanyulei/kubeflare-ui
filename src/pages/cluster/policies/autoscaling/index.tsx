import type { ProColumns } from '@ant-design/pro-components';
import { getClusterHorizontalPodAutoscalerList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  createStatusColumn,
  renderFallbackText,
  renderTextList,
} from '../../resource';
import CreateHorizontalPodAutoscalerDrawer from '../components/CreateHorizontalPodAutoscalerDrawer';

const HorizontalPodAutoscalers = () => {
  const columns: ProColumns<API.ClusterHorizontalPodAutoscalerItem>[] = [
    createResourceNameColumn<API.ClusterHorizontalPodAutoscalerItem>(
      'HorizontalPodAutoscaler',
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
      title: '副本范围',
      dataIndex: 'replicas',
      ellipsis: true,
      render: (_, record) =>
        `${record.min_replicas ?? '-'} - ${record.max_replicas ?? '-'}`,
    },
    {
      title: '当前/期望',
      dataIndex: 'current_replicas',
      ellipsis: true,
      render: (_, record) =>
        `${record.current_replicas ?? '-'} / ${record.desired_replicas ?? '-'}`,
    },
    {
      title: '指标',
      dataIndex: 'metrics',
      ellipsis: true,
      render: (_, record) => renderTextList(record.metrics),
    },
    createStatusColumn<API.ClusterHorizontalPodAutoscalerItem>('状态', {
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
    <ClusterResourceListPage<API.ClusterHorizontalPodAutoscalerItem>
      titleId="menu.cluster.clusterPolicies.clusterPoliciesAutoscaling"
      defaultTitle="弹性伸缩"
      columns={columns}
      createButtonText="新建自动伸缩"
      renderCreateDrawer={(props) => (
        <CreateHorizontalPodAutoscalerDrawer {...props} />
      )}
      request={getClusterHorizontalPodAutoscalerList}
      resourceType="HorizontalPodAutoscaler"
      resourceTypeName="自动伸缩策略"
      searchPlaceholder="搜索策略名称 / 目标工作负载"
      showNamespaceFilter
    />
  );
};

export default HorizontalPodAutoscalers;
