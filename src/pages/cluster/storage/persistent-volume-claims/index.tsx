import { getClusterPersistentVolumeClaimList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  createStatusColumn,
  renderBooleanText,
} from '../../resource';
import { createPersistentVolumeClaimConfig } from '../../resource/createConfigs';

const PersistentVolumeClaims = () => (
  <ClusterResourceListPage<API.ClusterPersistentVolumeClaimItem>
    titleId="menu.cluster.clusterStorage.clusterStoragePersistentVolumeClaims"
    defaultTitle="持久卷声明"
    searchPlaceholder="搜索持久卷声明名称 / 持久卷 / 访问模式"
    showNamespaceFilter
    createConfig={createPersistentVolumeClaimConfig}
    request={getClusterPersistentVolumeClaimList}
    columns={[
      createResourceNameColumn<API.ClusterPersistentVolumeClaimItem>(
        'PersistentVolumeClaim',
      ),
      createStatusColumn<API.ClusterPersistentVolumeClaimItem>('状态'),
      {
        title: '持久卷',
        dataIndex: 'volume_name',
        ellipsis: true,
        renderText: (_, record) => record.volume_name || '-',
      },
      {
        title: '访问模式',
        dataIndex: 'accessModes',
        renderText: (_, record) => record.accessModes?.join('、') || '-',
      },
      {
        title: '挂载状态',
        dataIndex: 'mounted',
        width: 120,
        renderText: (_, record) => renderBooleanText(record.mounted),
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

export default PersistentVolumeClaims;
