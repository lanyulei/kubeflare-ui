import { getClusterIngressList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
} from '../../resource';
import { createIngressConfig } from '../../resource/createConfigs';

const Ingresses = () => (
  <ClusterResourceListPage<API.ClusterIngressItem>
    titleId="menu.cluster.clusterWorkloads.clusterWorkloadsIngresses"
    defaultTitle="应用路由"
    searchPlaceholder="搜索应用路由名称 / 命名空间 / 网关地址"
    showNamespaceFilter
    createConfig={createIngressConfig}
    request={getClusterIngressList}
    columns={[
      createResourceNameColumn<API.ClusterIngressItem>('Ingress'),
      {
        title: '命名空间',
        dataIndex: 'namespace',
        ellipsis: true,
        renderText: (_, record) => record.namespace || '-',
      },
      {
        title: '网关地址',
        dataIndex: 'gateway_address',
        ellipsis: true,
        renderText: (_, record) => record.gateway_address || '-',
      },
      {
        title: 'Ingress Class',
        dataIndex: 'ingress_class',
        ellipsis: true,
        renderText: (_, record) => record.ingress_class || '-',
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

export default Ingresses;
