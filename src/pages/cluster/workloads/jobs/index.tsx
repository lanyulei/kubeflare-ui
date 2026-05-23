import { getClusterJobList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, { createStatusColumn } from '../../resource';
import { createJobConfig } from '../../resource/createConfigs';

const Jobs = () => {
  return (
    <ClusterResourceListPage<API.ClusterJobItem>
      titleId="menu.cluster.clusterWorkloads.clusterWorkloadsJobs"
      defaultTitle="任务"
      searchPlaceholder="搜索任务名称 / 命名空间"
      showNamespaceFilter
      createConfig={createJobConfig}
      request={getClusterJobList}
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
        createStatusColumn<API.ClusterJobItem>('状态'),
        {
          title: '上次运行时间',
          dataIndex: 'last_run_time',
          valueType: 'dateTime',
          width: 180,
        },
      ]}
    />
  );
};

export default Jobs;
