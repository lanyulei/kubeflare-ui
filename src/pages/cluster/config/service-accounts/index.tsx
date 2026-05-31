import { KubernetesCompatibilityNotice } from '@/components';
import { getClusterServiceAccountList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createResourceNameColumn,
  renderTextList,
} from '../../resource';
import CreateServiceAccountModal from './components/CreateServiceAccountModal';

const ServiceAccounts = () => (
  <ClusterResourceListPage<API.ClusterServiceAccountItem>
    titleId="menu.cluster.clusterConfig.clusterConfigServiceAccounts"
    defaultTitle="服务账户"
    searchPlaceholder="搜索服务账户名称 / 命名空间 / 角色"
    showNamespaceFilter
    renderCreateDrawer={(props) => <CreateServiceAccountModal {...props} />}
    extraContent={
      <KubernetesCompatibilityNotice
        message="Kubernetes 1.24+ 服务账户令牌说明"
        description="集群默认不再为每个 ServiceAccount 自动生成长期令牌 Secret；需要外部访问令牌时应使用 TokenRequest 或按需创建短期令牌。"
      />
    }
    request={getClusterServiceAccountList}
    columns={[
      createResourceNameColumn<API.ClusterServiceAccountItem>('ServiceAccount'),
      {
        title: '命名空间',
        dataIndex: 'namespace',
        ellipsis: true,
        renderText: (_, record) => record.namespace || '-',
      },
      {
        title: '角色',
        dataIndex: 'roles',
        render: (_, record) => renderTextList(record.roles),
      },
      {
        title: '镜像拉取 Secret',
        dataIndex: 'imagePullSecrets',
        render: (_, record) => renderTextList(record.imagePullSecrets),
      },
      {
        title: '挂载 Secret',
        dataIndex: 'mountableSecrets',
        render: (_, record) => renderTextList(record.mountableSecrets),
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

export default ServiceAccounts;
