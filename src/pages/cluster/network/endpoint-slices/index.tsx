import { getClusterEndpointSliceList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  renderTextList,
} from '../../resource';
import { createEndpointSliceConfig } from '../../resource/createConfigs';

const renderPorts = (ports?: API.ClusterServiceEndpointPort[]) =>
  renderTextList(
    (ports || []).flatMap((port) =>
      port.port
        ? [
            `${port.name || '-'}:${port.port}${port.protocol ? `/${port.protocol}` : ''}`,
          ]
        : [],
    ),
  );

const EndpointSlices = () => (
  <ClusterResourceListPage<API.ClusterEndpointSliceItem>
    titleId="menu.cluster.clusterNetwork.clusterEndpointSlices"
    defaultTitle="EndpointSlice"
    searchPlaceholder="搜索 EndpointSlice 名称 / 服务 / 地址类型"
    showNamespaceFilter
    createConfig={createEndpointSliceConfig}
    resourceType="EndpointSlice"
    resourceTypeName="EndpointSlice"
    request={getClusterEndpointSliceList}
    columns={[
      createResourceNameColumn<API.ClusterEndpointSliceItem>('EndpointSlice'),
      {
        title: '命名空间',
        dataIndex: 'namespace',
        ellipsis: true,
        renderText: (_, record) => record.namespace || '-',
      },
      {
        title: '服务',
        dataIndex: 'service_name',
        ellipsis: true,
        renderText: (_, record) => record.service_name || '-',
      },
      {
        title: '地址类型',
        dataIndex: 'address_type',
        width: 120,
        renderText: (_, record) => record.address_type || '-',
      },
      {
        title: '端点',
        dataIndex: 'endpoint_count',
        width: 130,
        renderText: (_, record) =>
          `${record.ready_count ?? 0} / ${record.endpoint_count ?? 0}`,
      },
      {
        title: '端口',
        dataIndex: 'ports',
        width: 240,
        render: (_, record) => renderPorts(record.ports),
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

export default EndpointSlices;
