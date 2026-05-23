import { getClusterCronJobList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, { createStatusColumn } from '../../resource';
import { createCronJobConfig } from '../../resource/createConfigs';

const CronJobs = () => (
  <ClusterResourceListPage<API.ClusterCronJobItem>
    titleId="menu.cluster.clusterWorkloads.clusterWorkloadsCronJobs"
    defaultTitle="定时任务"
    searchPlaceholder="搜索定时任务名称 / 命名空间"
    showNamespaceFilter
    createConfig={createCronJobConfig}
    request={getClusterCronJobList}
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
      createStatusColumn<API.ClusterCronJobItem>('状态'),
      {
        title: '定时任务',
        dataIndex: 'schedule',
        ellipsis: true,
        renderText: (_, record) => record.schedule || '-',
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

export default CronJobs;
