import { getClusterServiceList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
} from '../../resource';
import { createServiceConfig } from '../../resource/createConfigs';

const Services = () => (
  <ClusterResourceListPage<API.ClusterServiceItem>
    titleId="menu.cluster.clusterWorkloads.clusterWorkloadsServices"
    defaultTitle="服务"
    searchPlaceholder="搜索服务名称 / 命名空间 / 访问地址"
    showNamespaceFilter
    createConfig={createServiceConfig}
    request={getClusterServiceList}
    columns={[
      createResourceNameColumn<API.ClusterServiceItem>('Service'),
      {
        title: '命名空间',
        dataIndex: 'namespace',
        ellipsis: true,
        renderText: (_, record) => record.namespace || '-',
      },
      {
        title: '内部访问',
        dataIndex: 'internal_access',
        ellipsis: true,
        renderText: (_, record) => record.internal_access || '-',
      },
      {
        title: '外部访问',
        dataIndex: 'external_access',
        ellipsis: true,
        renderText: (_, record) => record.external_access || '-',
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

export default Services;
