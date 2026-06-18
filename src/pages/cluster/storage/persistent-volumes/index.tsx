import { getClusterPersistentVolumeList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  createStatusColumn,
} from '../../resource';
import CreatePersistentVolumeDrawer from './components/CreatePersistentVolumeDrawer';

const PersistentVolumes = () => (
  <ClusterResourceListPage<API.ClusterPersistentVolumeItem>
    titleId="menu.cluster.clusterStorage.clusterStoragePersistentVolumes"
    defaultTitle="持久卷"
    searchPlaceholder="搜索持久卷名称 / 声明 / 访问模式"
    resourceType="PersistentVolume"
    resourceTypeName="持久卷"
    renderCreateDrawer={({
      defaultNamespace: _defaultNamespace,
      namespaceOptions: _namespaceOptions,
      ...props
    }) => <CreatePersistentVolumeDrawer {...props} />}
    request={getClusterPersistentVolumeList}
    columns={[
      createResourceNameColumn<API.ClusterPersistentVolumeItem>(
        'PersistentVolume',
      ),
      createStatusColumn<API.ClusterPersistentVolumeItem>('状态'),
      {
        title: '容量',
        dataIndex: 'capacity',
        width: 120,
        renderText: (_, record) => record.capacity || '-',
      },
      {
        title: '访问模式',
        dataIndex: 'accessModes',
        width: 180,
        renderText: (_, record) => record.accessModes?.join('、') || '-',
      },
      {
        title: '回收策略',
        dataIndex: 'reclaim_policy',
        width: 120,
        renderText: (_, record) => record.reclaim_policy || '-',
      },
      {
        title: '存储类',
        dataIndex: 'storageClassName',
        ellipsis: true,
        renderText: (_, record) => record.storageClassName || '-',
      },
      {
        title: '绑定声明',
        dataIndex: 'claim_ref',
        ellipsis: true,
        renderText: (_, record) => record.claim_ref || '-',
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

export default PersistentVolumes;
