import { Space, Tag } from 'antd';
import { getClusterHorizontalPodAutoscalerList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  createStatusColumn,
} from '../../resource';
import { createHorizontalPodAutoscalerConfig } from '../../resource/createConfigs';
import CreateHorizontalPodAutoscalerDrawer from './components/CreateHorizontalPodAutoscalerDrawer';

const renderMetrics = (values?: string[]) => {
  if (!values?.length) {
    return '-';
  }

  return (
    <Space size={[0, 6]} wrap>
      {values.map((value) => (
        <Tag key={value}>{value}</Tag>
      ))}
    </Space>
  );
};

const HorizontalPodAutoscalers = () => (
  <ClusterResourceListPage<API.ClusterHorizontalPodAutoscalerItem>
    titleId="menu.cluster.clusterWorkloads.clusterWorkloadsHorizontalPodAutoscalers"
    defaultTitle="水平伸缩"
    searchPlaceholder="搜索水平伸缩名称 / 目标资源 / 指标"
    showNamespaceFilter
    createConfig={createHorizontalPodAutoscalerConfig}
    renderCreateDrawer={(props) => (
      <CreateHorizontalPodAutoscalerDrawer {...props} />
    )}
    resourceType="HorizontalPodAutoscaler"
    resourceTypeName="水平伸缩"
    request={getClusterHorizontalPodAutoscalerList}
    columns={[
      createResourceNameColumn<API.ClusterHorizontalPodAutoscalerItem>(
        'HorizontalPodAutoscaler',
      ),
      {
        title: '命名空间',
        dataIndex: 'namespace',
        ellipsis: true,
        renderText: (_, record) => record.namespace || '-',
      },
      createStatusColumn<API.ClusterHorizontalPodAutoscalerItem>('状态', {
        width: 130,
      }),
      {
        title: '伸缩目标',
        dataIndex: 'scale_target',
        ellipsis: true,
        renderText: (_, record) => record.scale_target || '-',
      },
      {
        title: '副本数',
        dataIndex: 'replicas',
        width: 140,
        renderText: (_, record) =>
          `${record.current_replicas ?? '-'} / ${record.desired_replicas ?? '-'} / ${record.max_replicas ?? '-'}`,
      },
      {
        title: '指标',
        dataIndex: 'metrics',
        width: 220,
        render: (_, record) => renderMetrics(record.metrics),
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

export default HorizontalPodAutoscalers;
