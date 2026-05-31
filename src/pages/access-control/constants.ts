export const ALL_NAMESPACES_VALUE = '__all__';

export const TABLE_DEFAULT_PAGE_SIZE = 10;

export const RBAC_RESOURCE_TYPES = [
  'Role',
  'ClusterRole',
  'RoleBinding',
  'ClusterRoleBinding',
] as const;

export const SUBJECT_KIND_OPTIONS = [
  { label: 'ServiceAccount', value: 'ServiceAccount' },
  { label: 'User', value: 'User' },
  { label: 'Group', value: 'Group' },
];

export const RBAC_VERB_OPTIONS = [
  'get',
  'list',
  'watch',
  'create',
  'update',
  'patch',
  'delete',
  'deletecollection',
  'impersonate',
  '*',
].map((value) => ({ label: value, value }));

export const RISK_LEVEL_TEXT: Record<API.RbacRiskLevel, string> = {
  Critical: '严重',
  High: '高危',
  Medium: '中危',
  Low: '低危',
  Info: '信息',
};
