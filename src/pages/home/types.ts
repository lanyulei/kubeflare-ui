export type QuickLink = {
  title: string;
  href: string;
  id?: string;
};

export type ProjectNotice = {
  id: string;
  title: string;
  logo: string;
  description: string;
  updatedAt: string;
  member: string;
  href: string;
  memberLink: string;
};

export type ActivityEntity = {
  name: string;
  link?: string;
  avatar?: string;
};

export type ActivityItem = {
  id: string;
  updatedAt: string;
  user: ActivityEntity & {
    avatar: string;
  };
  group?: ActivityEntity;
  project?: ActivityEntity;
  comment?: ActivityEntity;
  template: string;
};

export type RadarDataItem = {
  name: string;
  label: string;
  value: number;
};
