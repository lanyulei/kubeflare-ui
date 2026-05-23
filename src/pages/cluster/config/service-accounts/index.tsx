import { getClusterServiceAccountList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  renderTextList,
} from '../../resource';
import { createServiceAccountConfig } from '../../resource/createConfigs';

const ServiceAccounts = () => (
  <ClusterResourceListPage<API.ClusterServiceAccountItem>
    titleId="menu.cluster.clusterConfig.clusterConfigServiceAccounts"
    defaultTitle="服务账户"
    searchPlaceholder="搜索服务账户名称 / 命名空间 / 角色"
    showNamespaceFilter
    createConfig={createServiceAccountConfig}
    request={getClusterServiceAccountList}
    columns={[
      createResourceNameColumn<API.ClusterServiceAccountItem>('ServiceAccount'),
      {
        title: '命名空间',
        dataIndex: 'namespace',
        ellipsis: true,
        renderText: (_, record) => record.namespace || '-',
      },
      {
        title: '角色',
        dataIndex: 'roles',
        render: (_, record) => renderTextList(record.roles),
      },
      {
        title: '保密字典',
        dataIndex: 'secrets',
        render: (_, record) => renderTextList(record.secrets),
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

export default ServiceAccounts;
