import { getClusterSecretList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage from '../../resource';
import { createSecretConfig } from '../../resource/createConfigs';

const Secrets = () => (
  <ClusterResourceListPage<API.ClusterConfigResourceItem>
    titleId="menu.cluster.clusterConfig.clusterConfigSecrets"
    defaultTitle="保密字典"
    searchPlaceholder="搜索保密字典名称 / 命名空间 / 类型"
    showNamespaceFilter
    createConfig={createSecretConfig}
    request={getClusterSecretList}
    columns={[
      {
        title: '名称',
        dataIndex: 'name',
        ellipsis: true,
      },
      {
        title: '命名空间',
        dataIndex: 'namespace',
        ellipsis: true,
        renderText: (_, record) => record.namespace || '-',
      },
      {
        title: '类型',
        dataIndex: 'type',
        ellipsis: true,
        renderText: (_, record) => record.type || '-',
      },
      {
        title: '字段数量',
        dataIndex: 'keys',
        width: 120,
        renderText: (_, record) => record.keys.length,
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

export default Secrets;
