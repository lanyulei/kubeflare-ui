// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

const CURRENT_CLUSTER_STORAGE_KEY = 'kubeflare.currentClusterId'

type KubernetesMetadata = {
  uid?: string
  name?: string
  namespace?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
  creationTimestamp?: string
}

type KubernetesList<T> = {
  metadata?: {
    continue?: string
    remainingItemCount?: number
  }
  items?: T[]
}

type KubernetesRole = {
  metadata?: KubernetesMetadata
  rules?: API.RbacPolicyRule[]
  aggregationRule?: {
    clusterRoleSelectors?: unknown[]
  }
}

type KubernetesBinding = {
  metadata?: KubernetesMetadata
  subjects?: API.RbacSubject[]
  roleRef?: API.RbacRoleRef
}

const getCurrentClusterId = () => {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.localStorage.getItem(CURRENT_CLUSTER_STORAGE_KEY) || undefined
}

const getClusterHeaders = (
  clusterId: string,
  options?: { [key: string]: any },
) => ({
  'X-Cluster-ID': clusterId,
  ...options?.headers,
})

const emptyListResponse = <T>() =>
  ({
    code: 20000,
    message: '',
    data: {
      items: [] as T[],
    },
  }) as API.ApiResponse<API.RbacListData<T>>

const requestKubernetesList = async <T>(
  path: string,
  options?: { [key: string]: any },
) => {
  const clusterId = getCurrentClusterId()

  if (!clusterId) {
    return undefined
  }

  return request<API.ApiResponse<KubernetesList<T>>>(path, {
    method: 'GET',
    ...(options || {}),
    headers: getClusterHeaders(clusterId, options),
  })
}

const requestKubernetesPost = async <T>(
  path: string,
  data: Record<string, unknown>,
  options?: { [key: string]: any },
) => {
  const clusterId = getCurrentClusterId()

  if (!clusterId) {
    throw new Error('请先选择集群')
  }

  return request<API.ApiResponse<T>>(path, {
    method: 'POST',
    data,
    ...(options || {}),
    headers: getClusterHeaders(clusterId, options),
  })
}

const includeKeyword = (
  keyword: string | undefined,
  values: (string | number | boolean | undefined)[],
) => {
  const normalizedKeyword = keyword?.trim().toLowerCase()

  if (!normalizedKeyword) {
    return true
  }

  return values
    .filter((value) => value !== undefined && value !== '')
    .some((value) => String(value).toLowerCase().includes(normalizedKeyword))
}

const uniqueText = (values: (string | undefined)[]) =>
  Array.from(new Set(values.filter(Boolean) as string[]))

const riskOrder: Record<API.RbacRiskLevel, number> = {
  Critical: 5,
  High: 4,
  Medium: 3,
  Low: 2,
  Info: 1,
}

export const compareRbacRiskLevel = (
  first?: API.RbacRiskLevel,
  second?: API.RbacRiskLevel,
) => riskOrder[first || 'Info'] - riskOrder[second || 'Info']

const maxRiskLevel = (levels: (API.RbacRiskLevel | undefined)[]) =>
  levels.reduce<API.RbacRiskLevel>(
    (current, level) =>
      compareRbacRiskLevel(level, current) > 0 ? level || current : current,
    'Info',
  )

const hasAny = (values?: string[]) => values?.includes('*')

const hasWriteVerb = (verbs?: string[]) =>
  (verbs || []).some((verb) =>
    ['*', 'create', 'update', 'patch', 'delete', 'deletecollection'].includes(
      verb.toLowerCase(),
    ),
  )

const hasReadVerb = (verbs?: string[]) =>
  (verbs || []).some((verb) =>
    ['*', 'get', 'list', 'watch'].includes(verb.toLowerCase()),
  )

export const analyzeRbacRuleRisk = (
  rule: API.RbacPolicyRule,
): { level: API.RbacRiskLevel; reasons: string[] } => {
  const reasons: string[] = []
  const resources = rule.resources || []
  const verbs = rule.verbs || []

  if (hasAny(rule.apiGroups) && hasAny(resources) && hasAny(verbs)) {
    reasons.push('拥有所有 API 组、所有资源和所有动作权限')
  }
  if (resources.includes('secrets') && hasWriteVerb(verbs)) {
    reasons.push('可写 Secret')
  }
  if (resources.includes('secrets') && hasReadVerb(verbs)) {
    reasons.push('可读取 Secret')
  }
  if (
    resources.some((resource) =>
      [
        'roles',
        'rolebindings',
        'clusterroles',
        'clusterrolebindings',
      ].includes(resource),
    ) &&
    hasWriteVerb(verbs)
  ) {
    reasons.push('可修改 RBAC 授权资源')
  }
  if (
    resources.some((resource) =>
      ['pods/exec', 'pods/attach', 'pods/portforward'].includes(resource),
    ) &&
    hasWriteVerb(verbs)
  ) {
    reasons.push('可进入或转发 Pod 运行环境')
  }
  if (verbs.includes('impersonate')) {
    reasons.push('可模拟其他主体身份')
  }
  if (hasAny(resources) || hasAny(verbs)) {
    reasons.push('存在通配符权限')
  }

  if (
    reasons.some((reason) =>
      ['拥有所有 API 组、所有资源和所有动作权限', '可修改 RBAC 授权资源'].includes(
        reason,
      ),
    )
  ) {
    return { level: 'Critical', reasons }
  }
  if (reasons.some((reason) => ['可写 Secret', '可模拟其他主体身份'].includes(reason))) {
    return { level: 'High', reasons }
  }
  if (reasons.length) {
    return { level: 'Medium', reasons }
  }

  return { level: 'Info', reasons: [] }
}

const analyzeBindingRisk = (
  binding: KubernetesBinding,
  rules: API.RbacPolicyRule[],
): { level: API.RbacRiskLevel; reasons: string[] } => {
  const reasons = rules.flatMap((rule) => analyzeRbacRuleRisk(rule).reasons)
  const subjectReasons = (binding.subjects || []).flatMap((subject) => {
    if (
      subject.kind === 'Group' &&
      [
        'system:authenticated',
        'system:unauthenticated',
        'system:serviceaccounts',
        'system:masters',
      ].includes(subject.name)
    ) {
      return [`授权给宽泛系统组 ${subject.name}`]
    }
    return []
  })
  const roleReasons =
    binding.roleRef?.name === 'cluster-admin' ? ['绑定 cluster-admin'] : []
  const allReasons = uniqueText([...reasons, ...subjectReasons, ...roleReasons])

  if (roleReasons.length || subjectReasons.includes('授权给宽泛系统组 system:masters')) {
    return { level: 'Critical', reasons: allReasons }
  }
  if (
    subjectReasons.length &&
    rules.some((rule) => analyzeRbacRuleRisk(rule).level !== 'Info')
  ) {
    return { level: 'Critical', reasons: allReasons }
  }

  return {
    level: maxRiskLevel(rules.map((rule) => analyzeRbacRuleRisk(rule).level)),
    reasons: allReasons,
  }
}

const isSystemResource = (metadata?: KubernetesMetadata) =>
  Boolean(
    metadata?.name?.startsWith('system:') ||
      metadata?.labels?.['kubernetes.io/bootstrapping'] === 'rbac-defaults',
  )

const roleKey = (kind: string | undefined, name: string | undefined, namespace?: string) =>
  `${kind || '-'}:${namespace || '-'}:${name || '-'}`

const subjectKey = (subject: API.RbacSubject) =>
  `${subject.kind}:${subject.namespace || '-'}:${subject.name}`

const sortByScopeAndName = <T extends { namespace?: string; name: string }>(
  items: T[],
) =>
  items.sort((first, second) =>
    `${first.namespace || ''}/${first.name}`.localeCompare(
      `${second.namespace || ''}/${second.name}`,
    ),
  )

const normalizeSubject = (
  subject: API.RbacSubject,
  bindingNamespace?: string,
): API.RbacSubject => ({
  kind: subject.kind,
  name: subject.name,
  namespace:
    subject.kind === 'ServiceAccount'
      ? subject.namespace || bindingNamespace
      : subject.namespace,
  apiGroup: subject.apiGroup,
})

const toRoleItem = (
  role: KubernetesRole,
  type: 'Role' | 'ClusterRole',
  bindingCounts: Map<string, { bindings: number; subjects: number }>,
): API.RbacRoleItem => {
  const metadata = role.metadata || {}
  const rules = role.rules || []
  const risks = rules.map(analyzeRbacRuleRisk)
  const key = roleKey(type, metadata.name, metadata.namespace)
  const counts = bindingCounts.get(key)

  return {
    id: metadata.uid || `${type}-${metadata.namespace || '-'}-${metadata.name}`,
    name: metadata.name || '-',
    namespace: metadata.namespace,
    type,
    rules,
    rule_count: rules.length,
    binding_count: counts?.bindings || 0,
    subject_count: counts?.subjects || 0,
    risk_level: maxRiskLevel(risks.map((risk) => risk.level)),
    risk_reasons: uniqueText(risks.flatMap((risk) => risk.reasons)),
    system: isSystemResource(metadata),
    aggregated: Boolean(role.aggregationRule?.clusterRoleSelectors?.length),
    labels: metadata.labels,
    annotations: metadata.annotations,
    create_time: metadata.creationTimestamp,
    raw: role as Record<string, unknown>,
  }
}

const toBindingItem = (
  binding: KubernetesBinding,
  type: 'RoleBinding' | 'ClusterRoleBinding',
  roleRules: Map<string, API.RbacPolicyRule[]>,
): API.RbacBindingItem => {
  const metadata = binding.metadata || {}
  const subjects = (binding.subjects || []).map((subject) =>
    normalizeSubject(subject, metadata.namespace),
  )
  const roleRef = binding.roleRef
  const rules = roleRules.get(
    roleKey(roleRef?.kind, roleRef?.name, roleRef?.kind === 'Role' ? metadata.namespace : undefined),
  ) || []
  const risk = analyzeBindingRisk(binding, rules)

  return {
    id: metadata.uid || `${type}-${metadata.namespace || '-'}-${metadata.name}`,
    name: metadata.name || '-',
    namespace: metadata.namespace,
    type,
    subjects,
    roleRef,
    role_name: roleRef?.name,
    role_kind: roleRef?.kind,
    scope: type === 'ClusterRoleBinding' ? 'Cluster' : 'Namespace',
    rule_count: rules.length,
    risk_level: risk.level,
    risk_reasons: risk.reasons,
    system: isSystemResource(metadata),
    create_time: metadata.creationTimestamp,
    raw: binding as Record<string, unknown>,
  }
}

const getRoleMaps = async (options?: { [key: string]: any }) => {
  const [rolesRes, clusterRolesRes] = await Promise.all([
    requestKubernetesList<KubernetesRole>(
      '/kapis/rbac.authorization.k8s.io/v1/roles',
      options,
    ),
    requestKubernetesList<KubernetesRole>(
      '/kapis/rbac.authorization.k8s.io/v1/clusterroles',
      options,
    ),
  ])
  const roleRules = new Map<string, API.RbacPolicyRule[]>()
  const roles = rolesRes?.data?.items || []
  const clusterRoles = clusterRolesRes?.data?.items || []

  roles.forEach((role) => {
    roleRules.set(
      roleKey('Role', role.metadata?.name, role.metadata?.namespace),
      role.rules || [],
    )
  })
  clusterRoles.forEach((role) => {
    roleRules.set(roleKey('ClusterRole', role.metadata?.name), role.rules || [])
  })

  return { roleRules, roles, clusterRoles }
}

const getBindingCounts = (bindings: KubernetesBinding[]) => {
  const bindingCounts = new Map<string, { bindings: number; subjects: number }>()

  bindings.forEach((binding) => {
    const roleRef = binding.roleRef
    const key = roleKey(
      roleRef?.kind,
      roleRef?.name,
      roleRef?.kind === 'Role' ? binding.metadata?.namespace : undefined,
    )
    const current = bindingCounts.get(key) || { bindings: 0, subjects: 0 }
    current.bindings += 1
    current.subjects += binding.subjects?.length || 0
    bindingCounts.set(key, current)
  })

  return bindingCounts
}

const getAllBindings = async (options?: { [key: string]: any }) => {
  const [roleBindingsRes, clusterRoleBindingsRes] = await Promise.all([
    requestKubernetesList<KubernetesBinding>(
      '/kapis/rbac.authorization.k8s.io/v1/rolebindings',
      options,
    ),
    requestKubernetesList<KubernetesBinding>(
      '/kapis/rbac.authorization.k8s.io/v1/clusterrolebindings',
      options,
    ),
  ])

  return {
    roleBindings: roleBindingsRes?.data?.items || [],
    clusterRoleBindings: clusterRoleBindingsRes?.data?.items || [],
  }
}

export async function getRbacRoleList(
  params?: API.ClusterResourceListParams & { type?: 'Role' | 'ClusterRole' },
  options?: { [key: string]: any },
) {
  const { roles, clusterRoles } = await getRoleMaps(options)
  const bindings = await getAllBindings(options)
  const counts = getBindingCounts([
    ...bindings.roleBindings,
    ...bindings.clusterRoleBindings,
  ])
  const items = [
    ...(params?.type === 'ClusterRole'
      ? []
      : roles.map((role) => toRoleItem(role, 'Role', counts))),
    ...(params?.type === 'Role'
      ? []
      : clusterRoles.map((role) => toRoleItem(role, 'ClusterRole', counts))),
  ].filter((item) =>
    includeKeyword(params?.keyword, [
      item.name,
      item.namespace,
      item.type,
      item.risk_level,
      ...item.risk_reasons,
    ]),
  ).filter((item) => !params?.namespace || item.namespace === params.namespace)

  return {
    code: 20000,
    message: '',
    data: {
      items: sortByScopeAndName(items),
    },
  } as API.ApiResponse<API.RbacListData<API.RbacRoleItem>>
}

export async function getRbacBindingList(
  params?: API.ClusterResourceListParams & {
    type?: 'RoleBinding' | 'ClusterRoleBinding'
  },
  options?: { [key: string]: any },
) {
  const { roleRules } = await getRoleMaps(options)
  const bindings = await getAllBindings(options)
  const items = [
    ...(params?.type === 'ClusterRoleBinding'
      ? []
      : bindings.roleBindings.map((binding) =>
          toBindingItem(binding, 'RoleBinding', roleRules),
        )),
    ...(params?.type === 'RoleBinding'
      ? []
      : bindings.clusterRoleBindings.map((binding) =>
          toBindingItem(binding, 'ClusterRoleBinding', roleRules),
        )),
  ].filter((item) =>
    includeKeyword(params?.keyword, [
      item.name,
      item.namespace,
      item.type,
      item.role_name,
      item.role_kind,
      item.risk_level,
      ...item.subjects.map((subject) => subject.name),
      ...item.risk_reasons,
    ]),
  ).filter((item) => !params?.namespace || item.namespace === params.namespace)

  return {
    code: 20000,
    message: '',
    data: {
      items: sortByScopeAndName(items),
    },
  } as API.ApiResponse<API.RbacListData<API.RbacBindingItem>>
}

const subjectMatches = (
  actual: API.RbacSubject,
  query: API.RbacSubjectQuery,
) => {
  if (actual.kind !== query.kind || actual.name !== query.name) {
    return false
  }
  if (query.kind === 'ServiceAccount') {
    return actual.namespace === query.namespace
  }
  return true
}

export async function resolveRbacSubjectPermissions(
  query: API.RbacSubjectQuery,
  options?: { [key: string]: any },
) {
  if (!query.kind || !query.name || (query.kind === 'ServiceAccount' && !query.namespace)) {
    return {
      code: 20000,
      message: '',
      data: {
        items: [],
      },
    } as API.ApiResponse<API.RbacListData<API.RbacResolvedPermission>>
  }

  const { roleRules } = await getRoleMaps(options)
  const bindings = await getRbacBindingList(undefined, options)
  let index = 0
  const items = (bindings.data.items || []).flatMap((binding) => {
    const matchedSubjects = binding.subjects.filter((subject) =>
      subjectMatches(subject, query),
    )

    if (!matchedSubjects.length || !binding.roleRef?.name) {
      return []
    }

    if (
      query.scopeNamespace &&
      binding.scope === 'Namespace' &&
      binding.namespace !== query.scopeNamespace
    ) {
      return []
    }

    const rules = roleRules.get(
      roleKey(
        binding.roleRef.kind,
        binding.roleRef.name,
        binding.roleRef.kind === 'Role' ? binding.namespace : undefined,
      ),
    ) || []

    return rules.map((rule) => {
      const risk = analyzeRbacRuleRisk(rule)
      index += 1
      return {
        id: `${binding.id}-${index}`,
        subject: matchedSubjects[0],
        scope: binding.scope,
        namespace: binding.scope === 'Namespace' ? binding.namespace : undefined,
        rule,
        source: {
          bindingKind: binding.type,
          bindingName: binding.name,
          bindingNamespace: binding.namespace,
          roleKind: binding.roleRef?.kind || 'ClusterRole',
          roleName: binding.roleRef?.name || '-',
          roleNamespace:
            binding.roleRef?.kind === 'Role' ? binding.namespace : undefined,
        },
        risk_level: risk.level,
        risk_reasons: risk.reasons,
      } as API.RbacResolvedPermission
    })
  })

  return {
    code: 20000,
    message: '',
    data: {
      items,
    },
  } as API.ApiResponse<API.RbacListData<API.RbacResolvedPermission>>
}

export async function getRbacSubjectList(
  params?: API.ClusterResourceListParams & { kind?: API.RbacSubjectKind },
  options?: { [key: string]: any },
) {
  const bindings = await getRbacBindingList(undefined, options)
  const subjectMap = new Map<string, API.RbacSubjectItem>()

  ;(bindings.data.items || []).forEach((binding) => {
    binding.subjects.forEach((subject) => {
      const key = subjectKey(subject)
      const current =
        subjectMap.get(key) ||
        ({
          id: key,
          kind: subject.kind,
          name: subject.name,
          namespace: subject.namespace,
          binding_count: 0,
          cluster_binding_count: 0,
          permission_count: 0,
          risk_level: 'Info',
          risk_reasons: [],
        } as API.RbacSubjectItem)

      current.binding_count += 1
      current.cluster_binding_count += binding.type === 'ClusterRoleBinding' ? 1 : 0
      current.permission_count += binding.rule_count
      current.risk_level = maxRiskLevel([current.risk_level, binding.risk_level])
      current.risk_reasons = uniqueText([
        ...current.risk_reasons,
        ...binding.risk_reasons,
      ])
      subjectMap.set(key, current)
    })
  })

  const items = Array.from(subjectMap.values())
    .filter((item) => !params?.kind || item.kind === params.kind)
    .filter((item) =>
      includeKeyword(params?.keyword, [
        item.name,
        item.namespace,
        item.kind,
        item.risk_level,
        ...item.risk_reasons,
      ]),
    )

  return {
    code: 20000,
    message: '',
    data: {
      items: sortByScopeAndName(items),
    },
  } as API.ApiResponse<API.RbacListData<API.RbacSubjectItem>>
}

export async function dryRunRbacManifest(
  manifest: Record<string, unknown>,
  options?: { [key: string]: any },
) {
  const kind = manifest.kind as string | undefined
  const metadata = (manifest.metadata || {}) as {
    name?: string
    namespace?: string
  }
  const namespace = metadata.namespace
  const pathMap: Record<string, string | undefined> = {
    Role: namespace
      ? `/kapis/rbac.authorization.k8s.io/v1/namespaces/${encodeURIComponent(namespace)}/roles`
      : undefined,
    ClusterRole: '/kapis/rbac.authorization.k8s.io/v1/clusterroles',
    RoleBinding: namespace
      ? `/kapis/rbac.authorization.k8s.io/v1/namespaces/${encodeURIComponent(namespace)}/rolebindings`
      : undefined,
    ClusterRoleBinding: '/kapis/rbac.authorization.k8s.io/v1/clusterrolebindings',
  }
  const path = kind ? pathMap[kind] : undefined

  if (!path || !metadata.name) {
    throw new Error('YAML 缺少 kind、metadata.name 或 namespace')
  }

  return requestKubernetesPost<Record<string, unknown>>(
    `${path}?dryRun=All`,
    manifest,
    options,
  )
}
