import { getClusterStorageClassList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  renderBooleanText,
} from '../../resource';
import { createStorageClassConfig } from '../../resource/createConfigs';

const StorageClasses = () => (
  <ClusterResourceListPage<API.ClusterStorageClassItem>
    titleId="menu.cluster.clusterStorage.clusterStorageStorageClasses"
    defaultTitle="存储类"
    searchPlaceholder="搜索存储类名称 / 存储类型 / 供应者"
    createConfig={createStorageClassConfig}
    request={getClusterStorageClassList}
    columns={[
      createResourceNameColumn<API.ClusterStorageClassItem>('StorageClass'),
      {
        title: '存储类型',
        dataIndex: 'storage_type',
        ellipsis: true,
        renderText: (_, record) => record.storage_type || '-',
      },
      {
        title: '持久卷声明数量',
        dataIndex: 'persistent_volume_claim_count',
        width: 150,
        renderText: (_, record) => record.persistent_volume_claim_count || 0,
      },
      {
        title: '允许卷克隆',
        dataIndex: 'allow_volume_clone',
        width: 120,
        renderText: (_, record) => renderBooleanText(record.allow_volume_clone),
      },
      {
        title: '允许卷拓展',
        dataIndex: 'allow_volume_expansion',
        width: 120,
        renderText: (_, record) =>
          renderBooleanText(record.allow_volume_expansion),
      },
      {
        title: '供应者',
        dataIndex: 'provisioner',
        ellipsis: true,
        renderText: (_, record) => record.provisioner || '-',
      },
    ]}
  />
);

export default StorageClasses;
