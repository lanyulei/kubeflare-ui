import { getClusterPodList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  createStatusColumn,
} from '../../resource';
import { createPodConfig } from '../../resource/createConfigs';

const Pods = () => (
  <ClusterResourceListPage<API.ClusterPodItem>
    titleId="menu.cluster.clusterWorkloads.clusterWorkloadsPods"
    defaultTitle="容器组"
    searchPlaceholder="搜索容器组名称 / 命名空间 / 节点 / IP 地址"
    showNamespaceFilter
    createConfig={createPodConfig}
    request={getClusterPodList}
    columns={[
      createResourceNameColumn<API.ClusterPodItem>('Pod'),
      {
        title: '命名空间',
        dataIndex: 'namespace',
        ellipsis: true,
        renderText: (_, record) => record.namespace || '-',
      },
      createStatusColumn<API.ClusterPodItem>('状态'),
      {
        title: '节点',
        dataIndex: 'node_name',
        ellipsis: true,
        renderText: (_, record) => record.node_name || '-',
      },
      {
        title: 'IP 地址',
        dataIndex: 'pod_ip',
        width: 160,
        renderText: (_, record) => record.pod_ip || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'create_time',
        valueType: 'dateTime',
        width: 180,
      },
      {
        title: '更新时间',
        dataIndex: 'update_time',
        valueType: 'dateTime',
        width: 180,
      },
    ]}
  />
);

export default Pods;
