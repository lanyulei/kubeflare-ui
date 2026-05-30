import { stringify } from 'yaml';

export const formatList = (values?: string[]) =>
  values?.filter(Boolean).join('、') || '-';

export const getRuleResourceText = (rule: API.RbacPolicyRule) =>
  formatList([...(rule.resources || []), ...(rule.nonResourceURLs || [])]);

export const getSubjectText = (subject: API.RbacSubject) =>
  `${subject.kind}:${subject.namespace ? `${subject.namespace}/` : ''}${subject.name}`;

export const getBindingScopeText = (binding: API.RbacBindingItem) =>
  binding.scope === 'Cluster' ? '全集群' : binding.namespace || '-';

export const getRbacResourceType = (
  resource: API.RbacRoleItem | API.RbacBindingItem,
): API.ClusterResourceCreateType =>
  resource.type as API.ClusterResourceCreateType;

export const toYaml = (value?: Record<string, unknown>) =>
  stringify(value || {}, { indent: 2 });

export const getResourceNamespace = (
  resource: API.RbacRoleItem | API.RbacBindingItem,
) =>
  resource.type === 'Role' || resource.type === 'RoleBinding'
    ? resource.namespace
    : undefined;

export const getRiskWeight = (level?: API.RbacRiskLevel) => {
  const weights: Record<API.RbacRiskLevel, number> = {
    Critical: 5,
    High: 4,
    Medium: 3,
    Low: 2,
    Info: 1,
  };

  return weights[level || 'Info'];
};
