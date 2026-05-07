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
        path: '/cluster/custom-resource-definitions',
        name: 'clusterCustomResourceDefinitions',
        component: './cluster/custom-resource-definitions',
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
            path: '/cluster/storage/storage-classes',
            name: 'clusterStorageStorageClasses',
            component: './cluster/storage/storage-classes',
          },
        ],
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
