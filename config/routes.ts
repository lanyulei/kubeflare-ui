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
    path: '/admin',
    name: 'admin',
    icon: 'setting',
    access: 'canAdmin',
    routes: [
      {
        path: '/admin',
        redirect: '/admin/users',
      },
      {
        path: '/admin/users',
        name: 'users',
        component: './admin/users',
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
]
