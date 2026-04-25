import type { ActivityItem, ProjectNotice, QuickLink, RadarDataItem } from './types';

const now = Date.now();

const timeOffset = (hoursAgo: number) =>
  new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();

export const fallbackCurrentUser: API.CurrentUser = {
  id: 0,
  username: 'guest',
  nickname: '访客',
  avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
  email: 'antdesign@alipay.com',
  status: 1,
};

export const quickLinks: QuickLink[] = [
  { title: '操作一', href: '/home' },
  { title: '操作二', href: '/home' },
  { title: '操作三', href: '/home' },
  { title: '操作四', href: '/home' },
  { title: '操作五', href: '/home' },
  { title: '操作六', href: '/home' },
];

export const projectNotices: ProjectNotice[] = [
  {
    id: 'xxx1',
    title: 'Alipay',
    logo: 'https://gw.alipayobjects.com/zos/rmsportal/WdGqmHpayyMjiEhcKoVE.png',
    description: '那是一种内在的东西，他们到达不了，也无法触及的',
    updatedAt: timeOffset(2),
    member: '科学搬砖组',
    href: '/home',
    memberLink: '/home',
  },
  {
    id: 'xxx2',
    title: 'Angular',
    logo: 'https://gw.alipayobjects.com/zos/rmsportal/zOsKZmFRdUtvpqCImOVY.png',
    description: '希望是一个好东西，也许是最好的，好东西是不会消亡的',
    updatedAt: timeOffset(12),
    member: '全组都是吴彦祖',
    href: '/home',
    memberLink: '/home',
  },
  {
    id: 'xxx3',
    title: 'Ant Design',
    logo: 'https://gw.alipayobjects.com/zos/rmsportal/dURIMkkrRFpPgTuzkwnB.png',
    description: '城镇中有那么多的酒馆，她却偏偏走进了我的酒馆',
    updatedAt: timeOffset(20),
    member: '中二少女团',
    href: '/home',
    memberLink: '/home',
  },
  {
    id: 'xxx4',
    title: 'Ant Design Pro',
    logo: 'https://gw.alipayobjects.com/zos/rmsportal/sfjbOqnsXXJgNCjCzDBL.png',
    description: '那时候我只会想自己想要什么，从不想自己拥有什么',
    updatedAt: timeOffset(28),
    member: '程序员日常',
    href: '/home',
    memberLink: '/home',
  },
  {
    id: 'xxx5',
    title: 'Bootstrap',
    logo: 'https://gw.alipayobjects.com/zos/rmsportal/siCrBXXhmvTQGWPNLBow.png',
    description: '凛冬将至',
    updatedAt: timeOffset(36),
    member: '高逼格设计天团',
    href: '/home',
    memberLink: '/home',
  },
  {
    id: 'xxx6',
    title: 'React',
    logo: 'https://gw.alipayobjects.com/zos/rmsportal/kZzEzemZyKLKFsojXItE.png',
    description: '生命就像一盒巧克力，结果往往出人意料',
    updatedAt: timeOffset(48),
    member: '骗你来学计算机',
    href: '/home',
    memberLink: '/home',
  },
];

export const activities: ActivityItem[] = [
  {
    id: 'trend-1',
    updatedAt: timeOffset(1),
    user: {
      name: '曲丽丽',
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
    },
    group: {
      name: '高逼格设计天团',
      link: 'https://github.com/',
    },
    project: {
      name: '六月迭代',
      link: 'https://github.com/',
    },
    template: '在 @{group} 新建项目 @{project}',
  },
  {
    id: 'trend-2',
    updatedAt: timeOffset(3),
    user: {
      name: '付小小',
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/cnrhVkzwxjPwAaCfPbdc.png',
    },
    group: {
      name: '高逼格设计天团',
      link: 'https://github.com/',
    },
    project: {
      name: '六月迭代',
      link: 'https://github.com/',
    },
    template: '在 @{group} 新建项目 @{project}',
  },
  {
    id: 'trend-3',
    updatedAt: timeOffset(6),
    user: {
      name: '林东东',
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/gaOngJwsRYRaVAuXXcmB.png',
    },
    group: {
      name: '中二少女团',
      link: 'https://github.com/',
    },
    project: {
      name: '六月迭代',
      link: 'https://github.com/',
    },
    template: '在 @{group} 新建项目 @{project}',
  },
  {
    id: 'trend-4',
    updatedAt: timeOffset(10),
    user: {
      name: '周星星',
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/WhxKECPNujWoWEFNdnJE.png',
    },
    project: {
      name: '5 月日常迭代',
      link: 'https://github.com/',
    },
    template: '将 @{project} 更新至已发布状态',
  },
  {
    id: 'trend-5',
    updatedAt: timeOffset(15),
    user: {
      name: '朱偏右',
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/ubnKSIfAJTxIgXOKlciN.png',
    },
    project: {
      name: '工程效能',
      link: 'https://github.com/',
    },
    comment: {
      name: '留言',
      link: 'https://github.com/',
    },
    template: '在 @{project} 发布了 @{comment}',
  },
  {
    id: 'trend-6',
    updatedAt: timeOffset(24),
    user: {
      name: '乐哥',
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/jZUIxmJycoymBprLOUbT.png',
    },
    group: {
      name: '程序员日常',
      link: 'https://github.com/',
    },
    project: {
      name: '品牌迭代',
      link: 'https://github.com/',
    },
    template: '在 @{group} 新建项目 @{project}',
  },
];

const radarOriginData = [
  {
    name: '个人',
    ref: 10,
    koubei: 8,
    output: 4,
    contribute: 5,
    hot: 7,
  },
  {
    name: '团队',
    ref: 3,
    koubei: 9,
    output: 6,
    contribute: 3,
    hot: 1,
  },
  {
    name: '部门',
    ref: 4,
    koubei: 1,
    output: 6,
    contribute: 5,
    hot: 7,
  },
];

const radarTitleMap = {
  ref: '引用',
  koubei: '口碑',
  output: '产量',
  contribute: '贡献',
  hot: '热度',
};

export const radarData: RadarDataItem[] = radarOriginData.flatMap((item) =>
  Object.entries(item)
    .filter(([key]) => key !== 'name')
    .map(([key, value]) => ({
      name: item.name,
      label: radarTitleMap[key as keyof typeof radarTitleMap],
      value: value as number,
    })),
);
