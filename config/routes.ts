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
        name: 'list',
        component: './cluster',
      },
      {
        path: '/cluster/node',
        name: 'node',
        routes: [
          {
            path: '/cluster/node',
            redirect: '/cluster/node/nodes',
          },
          {
            path: '/cluster/node/nodes',
            name: 'nodes',
            component: './cluster/node/nodes',
          },
        ],
      },
      {
        path: '/cluster/namespaces',
        name: 'namespaces',
        component: './cluster/namespaces',
      },
      {
        path: '/cluster/workloads',
        name: 'workloads',
        routes: [
          {
            path: '/cluster/workloads',
            redirect: '/cluster/workloads/workloads',
          },
          {
            path: '/cluster/workloads/workloads',
            name: 'workloads',
            component: './cluster/workloads/workloads',
          },
          {
            path: '/cluster/workloads/jobs',
            name: 'jobs',
            component: './cluster/workloads/jobs',
          },
          {
            path: '/cluster/workloads/cron-jobs',
            name: 'cron-jobs',
            component: './cluster/workloads/cron-jobs',
          },
          {
            path: '/cluster/workloads/pods',
            name: 'pods',
            component: './cluster/workloads/pods',
          },
          {
            path: '/cluster/workloads/services',
            name: 'services',
            component: './cluster/workloads/services',
          },
          {
            path: '/cluster/workloads/ingresses',
            name: 'ingresses',
            component: './cluster/workloads/ingresses',
          },
        ],
      },
      {
        path: '/cluster/config',
        name: 'config',
        routes: [
          {
            path: '/cluster/config',
            redirect: '/cluster/config/secrets',
          },
          {
            path: '/cluster/config/secrets',
            name: 'secrets',
            component: './cluster/config/secrets',
          },
          {
            path: '/cluster/config/config-maps',
            name: 'config-maps',
            component: './cluster/config/config-maps',
          },
          {
            path: '/cluster/config/service-accounts',
            name: 'service-accounts',
            component: './cluster/config/service-accounts',
          },
        ],
      },
      {
        path: '/cluster/custom-resource-definitions',
        name: 'custom-resource-definitions',
        component: './cluster/custom-resource-definitions',
      },
      {
        path: '/cluster/storage',
        name: 'storage',
        routes: [
          {
            path: '/cluster/storage',
            redirect: '/cluster/storage/persistent-volume-claims',
          },
          {
            path: '/cluster/storage/persistent-volume-claims',
            name: 'persistent-volume-claims',
            component: './cluster/storage/persistent-volume-claims',
          },
          {
            path: '/cluster/storage/storage-classes',
            name: 'storage-classes',
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
        name: 'user',
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
        name: 'settings',
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
