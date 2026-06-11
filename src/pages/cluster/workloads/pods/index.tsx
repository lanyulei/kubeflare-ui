import { getClusterPodList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  createStatusColumn,
} from '../../resource';

const POD_NAME_COLUMN_WIDTH = 300;
const POD_NAMESPACE_COLUMN_WIDTH = 180;
const POD_STATUS_COLUMN_WIDTH = 160;
const POD_NODE_COLUMN_WIDTH = 240;
const POD_IP_COLUMN_WIDTH = 160;
const POD_TIME_COLUMN_WIDTH = 180;
const POD_TABLE_SCROLL_X =
  POD_NAME_COLUMN_WIDTH +
  POD_NAMESPACE_COLUMN_WIDTH +
  POD_STATUS_COLUMN_WIDTH +
  POD_NODE_COLUMN_WIDTH +
  POD_IP_COLUMN_WIDTH +
  POD_TIME_COLUMN_WIDTH * 2;

const Pods = () => (
  <ClusterResourceListPage<API.ClusterPodItem>
    titleId="menu.cluster.clusterWorkloads.clusterWorkloadsPods"
    defaultTitle="容器组"
    searchPlaceholder="搜索容器组名称 / 命名空间 / 节点 / IP 地址"
    showNamespaceFilter
    request={getClusterPodList}
    tableScroll={{ x: POD_TABLE_SCROLL_X }}
    columns={[
      {
        ...createResourceNameColumn<API.ClusterPodItem>('Pod'),
        width: POD_NAME_COLUMN_WIDTH,
      },
      {
        title: '命名空间',
        dataIndex: 'namespace',
        ellipsis: true,
        width: POD_NAMESPACE_COLUMN_WIDTH,
        renderText: (_, record) => record.namespace || '-',
      },
      createStatusColumn<API.ClusterPodItem>('状态', {
        ellipsis: true,
        width: POD_STATUS_COLUMN_WIDTH,
      }),
      {
        title: '节点',
        dataIndex: 'node_name',
        ellipsis: true,
        width: POD_NODE_COLUMN_WIDTH,
        renderText: (_, record) => record.node_name || '-',
      },
      {
        title: 'IP 地址',
        dataIndex: 'pod_ip',
        width: POD_IP_COLUMN_WIDTH,
        renderText: (_, record) => record.pod_ip || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'create_time',
        valueType: 'dateTime',
        width: POD_TIME_COLUMN_WIDTH,
      },
      {
        title: '更新时间',
        dataIndex: 'update_time',
        valueType: 'dateTime',
        width: POD_TIME_COLUMN_WIDTH,
      },
    ]}
  />
);

export default Pods;
