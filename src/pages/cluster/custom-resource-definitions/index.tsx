import { getClusterCustomResourceDefinitionList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, { createResourceNameColumn } from '../resource';
import { createCustomResourceDefinitionConfig } from '../resource/createConfigs';

const CustomResourceDefinitions = () => (
  <ClusterResourceListPage<API.ClusterCustomResourceDefinitionItem>
    titleId="menu.cluster.clusterCustomResourceDefinitions"
    defaultTitle="定制资源定义"
    searchPlaceholder="搜索定制资源定义类别 / 名称 / 作用域"
    createConfig={createCustomResourceDefinitionConfig}
    request={getClusterCustomResourceDefinitionList}
    columns={[
      createResourceNameColumn<API.ClusterCustomResourceDefinitionItem>(
        'CustomResourceDefinition',
      ),
      {
        title: '类别',
        dataIndex: 'category',
        ellipsis: true,
        renderText: (_, record) => record.category || '-',
      },
      {
        title: '作用域',
        dataIndex: 'scope',
        width: 140,
        renderText: (_, record) => record.scope || '-',
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

export default CustomResourceDefinitions;
