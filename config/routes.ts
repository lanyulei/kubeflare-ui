export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    path: '/terminal/cluster/:clusterId/namespaces/:namespace/pods/:podName/containers/:containerName',
    layout: false,
    component: './cluster/terminal/container',
  },
  {
    path: '/home',
    name: 'home',
    icon: 'home',
    component: './home',
  },
  {
    path: '/cluster',
    name: 'cluster',
    icon: 'cluster',
    routes: [
      {
        path: '/cluster',
        redirect: '/cluster/list',
      },
      {
        path: '/cluster/list',
        name: 'clusterList',
        component: './cluster',
      },
      {
        path: '/cluster/node',
        name: 'clusterNode',
        routes: [
          {
            path: '/cluster/node',
            redirect: '/cluster/node/list',
          },
          {
            path: '/cluster/node/list',
            name: 'clusterNodeList',
            component: './cluster/node/nodes',
          },
          {
            path: '/cluster/node/detail/:name',
            name: 'clusterNodeDetail',
            hideInMenu: true,
            component: './cluster/node/detail',
          },
        ],
      },
      {
        path: '/cluster/namespaces',
        name: 'clusterNamespaces',
        component: './cluster/namespaces',
      },
      {
        path: '/cluster/namespaces/detail/:name',
        name: 'clusterNamespacesDetail',
        hideInMenu: true,
        component: './cluster/namespaces/detail',
      },
      {
        path: '/cluster/resource/detail/:type/:namespace/:name',
        name: 'clusterResourceDetail',
        hideInMenu: true,
        component: './cluster/resource/detail',
      },
      {
        path: '/cluster/workloads',
        name: 'clusterWorkloads',
        routes: [
          {
            path: '/cluster/workloads',
            redirect: '/cluster/workloads/list',
          },
          {
            path: '/cluster/workloads/list',
            name: 'clusterWorkloadsList',
            component: './cluster/workloads/workloads',
          },
          {
            path: '/cluster/workloads/detail/:type/:namespace/:name',
            name: 'clusterWorkloadsDetail',
            hideInMenu: true,
            component: './cluster/workloads/workloads/detail',
          },
          {
            path: '/cluster/workloads/jobs',
            name: 'clusterWorkloadsJobs',
            component: './cluster/workloads/jobs',
          },
          {
            path: '/cluster/workloads/cron-jobs',
            name: 'clusterWorkloadsCronJobs',
            component: './cluster/workloads/cron-jobs',
          },
          {
            path: '/cluster/workloads/pods',
            name: 'clusterWorkloadsPods',
            component: './cluster/workloads/pods',
          },
          {
            path: '/cluster/workloads/services',
            name: 'clusterWorkloadsServices',
            component: './cluster/workloads/services',
          },
          {
            path: '/cluster/workloads/ingresses',
            name: 'clusterWorkloadsIngresses',
            component: './cluster/workloads/ingresses',
          },
          {
            path: '/cluster/workloads/horizontal-pod-autoscalers',
            name: 'clusterWorkloadsHorizontalPodAutoscalers',
            component: './cluster/workloads/horizontal-pod-autoscalers',
          },
        ],
      },
      {
        path: '/cluster/network',
        name: 'clusterNetwork',
        routes: [
          {
            path: '/cluster/network',
            redirect: '/cluster/network/network-policies',
          },
          {
            path: '/cluster/network/network-policies',
            name: 'clusterNetworkPolicies',
            component: './cluster/network/network-policies',
          },
          {
            path: '/cluster/network/ingress-classes',
            name: 'clusterIngressClasses',
            component: './cluster/network/ingress-classes',
          },
          {
            path: '/cluster/network/endpoint-slices',
            name: 'clusterEndpointSlices',
            component: './cluster/network/endpoint-slices',
          },
        ],
      },
      {
        path: '/cluster/config',
        name: 'clusterConfig',
        routes: [
          {
            path: '/cluster/config',
            redirect: '/cluster/config/secrets',
          },
          {
            path: '/cluster/config/secrets',
            name: 'clusterConfigSecrets',
            component: './cluster/config/secrets',
          },
          {
            path: '/cluster/config/config-maps',
            name: 'clusterConfigConfigMaps',
            component: './cluster/config/config-maps',
          },
          {
            path: '/cluster/config/service-accounts',
            name: 'clusterConfigServiceAccounts',
            component: './cluster/config/service-accounts',
          },
        ],
      },
      {
        path: '/cluster/storage',
        name: 'clusterStorage',
        routes: [
          {
            path: '/cluster/storage',
            redirect: '/cluster/storage/persistent-volume-claims',
          },
          {
            path: '/cluster/storage/persistent-volume-claims',
            name: 'clusterStoragePersistentVolumeClaims',
            component: './cluster/storage/persistent-volume-claims',
          },
          {
            path: '/cluster/storage/persistent-volumes',
            name: 'clusterStoragePersistentVolumes',
            component: './cluster/storage/persistent-volumes',
          },
          {
            path: '/cluster/storage/storage-classes',
            name: 'clusterStorageStorageClasses',
            component: './cluster/storage/storage-classes',
          },
        ],
      },
      {
        path: '/cluster/access-control',
        name: 'clusterAccessControl',
        icon: 'safety',
        routes: [
          {
            path: '/cluster/access-control',
            redirect: '/cluster/access-control/roles',
          },
          {
            path: '/cluster/access-control/roles',
            name: 'clusterAccessControlRoles',
            component: './access-control/roles',
          },
          {
            path: '/cluster/access-control/bindings',
            name: 'clusterAccessControlBindings',
            component: './access-control/bindings',
          },
        ],
      },
      {
        path: '/cluster/events',
        name: 'clusterEvents',
        component: './cluster/events',
      },
      {
        path: '/cluster/custom-resource-definitions',
        name: 'clusterCustomResourceDefinitions',
        component: './cluster/custom-resource-definitions',
      },
    ],
  },
  {
    path: '/gitops',
    name: 'gitops',
    icon: 'deploymentUnit',
    routes: [
      {
        path: '/gitops',
        redirect: '/gitops/dashboard',
      },
      {
        path: '/gitops/dashboard',
        name: 'gitopsDashboard',
        component: './gitops/dashboard',
      },
      {
        path: '/gitops/provider',
        name: 'gitopsProvider',
        component: './gitops/provider',
      },
      {
        path: '/gitops/application',
        name: 'gitopsApplication',
        component: './gitops/application',
      },
      {
        path: '/gitops/release',
        name: 'gitopsRelease',
        component: './gitops/release',
      },
      {
        path: '/gitops/sync',
        name: 'gitopsSync',
        component: './gitops/sync',
      },
      {
        path: '/gitops/audit',
        name: 'gitopsAudit',
        component: './gitops/audit',
      },
    ],
  },
  {
    path: '/ai',
    name: 'systemAI',
    icon: 'robot',
    routes: [
      {
        path: '/ai',
        redirect: '/ai/agent',
      },
      {
        path: '/ai/agent',
        name: 'systemAIAgent',
        component: './system/ai/agents',
      },
      {
        path: '/ai/runs',
        name: 'systemAIRuns',
        component: './system/ai/runs',
      },
      {
        path: '/ai/runtime',
        name: 'systemAIRuntime',
        component: './system/ai/runtime',
      },
      {
        path: '/ai/evaluation',
        name: 'systemAIEvaluation',
        component: './system/ai/evaluation',
      },
      {
        path: '/ai/learning',
        name: 'systemAILearning',
        component: './system/ai/learning',
      },
      {
        path: '/ai/tool',
        name: 'systemAITool',
        component: './system/ai/tools',
      },
      {
        path: '/ai/skill',
        name: 'systemAISkill',
        component: './system/ai/skills',
      },
    ],
  },
  {
    path: '/system',
    name: 'system',
    icon: 'setting',
    routes: [
      {
        path: '/system',
        redirect: '/system/user',
      },
      {
        path: '/system/user',
        name: 'systemUser',
        component: './system/users',
      },
    ],
  },
  {
    path: '/account',
    name: 'account',
    icon: 'user',
    hideInMenu: true,
    routes: [
      {
        path: '/account/settings',
        name: 'accountSettings',
        component: './account/settings',
      },
    ],
  },
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
