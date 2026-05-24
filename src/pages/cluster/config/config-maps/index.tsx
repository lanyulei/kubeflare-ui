import { getClusterConfigMapList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  renderTextList,
} from '../../resource';
import CreateConfigMapDrawer from './components/CreateConfigMapDrawer';

const ConfigMaps = () => (
  <ClusterResourceListPage<API.ClusterConfigResourceItem>
    titleId="menu.cluster.clusterConfig.clusterConfigConfigMaps"
    defaultTitle="配置字典"
    searchPlaceholder="搜索配置字典名称 / 命名空间 / 字段"
    showNamespaceFilter
    renderCreateDrawer={(props) => <CreateConfigMapDrawer {...props} />}
    request={getClusterConfigMapList}
    columns={[
      createResourceNameColumn<API.ClusterConfigResourceItem>('ConfigMap'),
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
