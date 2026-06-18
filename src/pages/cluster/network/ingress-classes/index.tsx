import { Tag } from 'antd';
import { getClusterIngressClassList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
} from '../../resource';
import { createIngressClassConfig } from '../../resource/createConfigs';
import CreateIngressClassDrawer from './components/CreateIngressClassDrawer';

const IngressClasses = () => (
  <ClusterResourceListPage<API.ClusterIngressClassItem>
    titleId="menu.cluster.clusterNetwork.clusterIngressClasses"
    defaultTitle="Ingress 类"
    searchPlaceholder="搜索 Ingress 类名称 / 控制器 / 参数引用"
    createConfig={createIngressClassConfig}
    renderCreateDrawer={({ namespaceOptions: _namespaceOptions, ...props }) => (
      <CreateIngressClassDrawer {...props} />
    )}
    resourceType="IngressClass"
    resourceTypeName="Ingress 类"
    request={getClusterIngressClassList}
    columns={[
      createResourceNameColumn<API.ClusterIngressClassItem>('IngressClass'),
      {
        title: '默认',
        dataIndex: 'default_class',
        width: 100,
        render: (_, record) =>
          record.default_class ? (
            <Tag color="success">默认</Tag>
          ) : (
            <Tag>普通</Tag>
          ),
      },
      {
        title: '控制器',
        dataIndex: 'controller',
        ellipsis: true,
        renderText: (_, record) => record.controller || '-',
      },
      {
        title: '参数引用',
        dataIndex: 'parameters',
        ellipsis: true,
        renderText: (_, record) => record.parameters || '-',
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

export default IngressClasses;
