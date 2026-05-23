import { getClusterConfigMapList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, { renderTextList } from '../../resource';
import { createConfigMapConfig } from '../../resource/createConfigs';

const ConfigMaps = () => (
  <ClusterResourceListPage<API.ClusterConfigResourceItem>
    titleId="menu.cluster.clusterConfig.clusterConfigConfigMaps"
    defaultTitle="配置字典"
    searchPlaceholder="搜索配置字典名称 / 命名空间 / 字段"
    showNamespaceFilter
    createConfig={createConfigMapConfig}
    request={getClusterConfigMapList}
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
        title: '字段',
        dataIndex: 'keys',
        render: (_, record) => renderTextList(record.keys),
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

export default ConfigMaps;
