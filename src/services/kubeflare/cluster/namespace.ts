// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

const CURRENT_CLUSTER_STORAGE_KEY = 'kubeflare.currentClusterId'

type KubernetesNamespace = {
  metadata?: {
    uid?: string
    name?: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
    creationTimestamp?: string
  }
  status?: {
    phase?: string
    conditions?: KubernetesNamespaceCondition[]
  }
}

type KubernetesNamespaceList = {
  metadata?: {
    continue?: string
    remainingItemCount?: number
  }
  items?: KubernetesNamespace[]
}

type KubernetesNamespaceCondition = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastTransitionTime?: string
}

type KubernetesProbe = {
  initialDelaySeconds?: number
  timeoutSeconds?: number
  httpGet?: {
    path?: string
    port?: number | string
    scheme?: string
  }
  tcpSocket?: {
    port?: number | string
  }
  exec?: {
    command?: string[]
  }
}

type KubernetesContainerPort = {
  name?: string
  containerPort?: number
  protocol?: string
}

type KubernetesContainer = {
  name?: string
  image?: string
  ports?: KubernetesContainerPort[]
  readinessProbe?: KubernetesProbe
  livenessProbe?: KubernetesProbe
  startupProbe?: KubernetesProbe
}

type KubernetesContainerStatus = {
  name?: string
  ready?: boolean
  restartCount?: number
  state?: {
    running?: Record<string, unknown>
    waiting?: {
      reason?: string
    }
    terminated?: {
      reason?: string
    }
  }
}

type KubernetesPod = {
  metadata?: {
    uid?: string
    name?: string
    namespace?: string
    creationTimestamp?: string
    deletionTimestamp?: string
  }
  spec?: {
    nodeName?: string
    containers?: KubernetesContainer[]
  }
  status?: {
    podIP?: string
    phase?: string
    reason?: string
    containerStatuses?: KubernetesContainerStatus[]
  }
}

type KubernetesPodList = {
  metadata?: {
    continue?: string
    remainingItemCount?: number
  }
  items?: KubernetesPod[]
}

type KubernetesResourceQuota = {
  metadata?: {
    uid?: string
    name?: string
    creationTimestamp?: string
  }
  status?: {
    hard?: Record<string, string>
    used?: Record<string, string>
  }
}

type KubernetesResourceQuotaList = {
  metadata?: {
    continue?: string
    remainingItemCount?: number
  }
  items?: KubernetesResourceQuota[]
}

type KubernetesLimitRange = {
  spec?: {
    limits?: {
      type?: string
      default?: Record<string, string>
      defaultRequest?: Record<string, string>
    }[]
  }
}

type KubernetesLimitRangeList = {
  items?: KubernetesLimitRange[]
}

type KubernetesResourceList = {
  metadata?: {
    remainingItemCount?: number
  }
  items?: unknown[]
}

const namespaceResourceStatusKeys = [
  'pods',
  'deployments',
  'statefulsets',
  'daemonsets',
  'jobs',
  'cronjobs',
  'persistentVolumeClaims',
  'services',
  'ingresses',
] as const

const namespaceResourceStatusPaths: Record<
  (typeof namespaceResourceStatusKeys)[number],
  string
> = {
  pods: '/kapi/v1/namespaces/:namespace/pods',
  deployments: '/kapis/apps/v1/namespaces/:namespace/deployments',
  statefulsets: '/kapis/apps/v1/namespaces/:namespace/statefulsets',
  daemonsets: '/kapis/apps/v1/namespaces/:namespace/daemonsets',
  jobs: '/kapis/batch/v1/namespaces/:namespace/jobs',
  cronjobs: '/kapis/batch/v1/namespaces/:namespace/cronjobs',
  persistentVolumeClaims:
    '/kapi/v1/namespaces/:namespace/persistentvolumeclaims',
  services: '/kapi/v1/namespaces/:namespace/services',
  ingresses: '/kapis/networking.k8s.io/v1/namespaces/:namespace/ingresses',
}

const getCurrentClusterId = () => {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.localStorage.getItem(CURRENT_CLUSTER_STORAGE_KEY) || undefined
}

const toClusterNamespaceItem = (
  namespace: KubernetesNamespace,
): API.ClusterNamespaceItem => ({
  id: namespace.metadata?.uid || namespace.metadata?.name,
  name: namespace.metadata?.name || '-',
  status: namespace.status?.phase,
  conditions: namespace.status?.conditions,
  labels: namespace.metadata?.labels,
  annotations: namespace.metadata?.annotations,
  create_time: namespace.metadata?.creationTimestamp,
})

const getContainerStatus = (status?: KubernetesContainerStatus) => {
  if (status?.state?.running) {
    return '运行中'
  }
  return (
    status?.state?.waiting?.reason ||
    status?.state?.terminated?.reason ||
    '未知'
  )
}

const getPodReady = (pod: KubernetesPod) => {
  const statuses = pod.status?.containerStatuses || []
  const total = pod.spec?.containers?.length || statuses.length
  const ready = statuses.filter((status) => status.ready).length

  return `${ready}/${total}`
}

const getPodStatus = (pod: KubernetesPod) => {
  if (pod.metadata?.deletionTimestamp) {
    return 'Terminating'
  }

  return (
    pod.status?.reason ||
    pod.status?.containerStatuses?.find((status) => status.state?.waiting)
      ?.state?.waiting?.reason ||
    pod.status?.containerStatuses?.find((status) => status.state?.terminated)
      ?.state?.terminated?.reason ||
    pod.status?.phase ||
    '-'
  )
}

const getProbeHandler = (probe: KubernetesProbe) => {
  if (probe.httpGet) {
    return {
      handler: 'HTTP 请求',
      detail: `GET ${probe.httpGet.path || '/'} on port ${
        probe.httpGet.port || '-'
      }${probe.httpGet.scheme ? ` (${probe.httpGet.scheme})` : ''}`,
    }
  }

  if (probe.tcpSocket) {
    return {
      handler: 'TCP Socket',
      detail: `TCP check on port ${probe.tcpSocket.port || '-'}`,
    }
  }

  if (probe.exec) {
    return {
      handler: '命令',
      detail: probe.exec.command?.join(' ') || '-',
    }
  }

  return {
    handler: '探针',
    detail: '-',
  }
}

const toClusterNodePodProbe = (
  probe: KubernetesProbe | undefined,
  type: string,
): API.ClusterNodePodContainerProbe | undefined => {
  if (!probe) {
    return undefined
  }

  const handler = getProbeHandler(probe)

  return {
    type,
    handler: handler.handler,
    detail: handler.detail,
    initial_delay_seconds: probe.initialDelaySeconds,
    timeout_seconds: probe.timeoutSeconds,
  }
}

const toClusterNodePodItem = (pod: KubernetesPod): API.ClusterNodePodItem => ({
  id: pod.metadata?.uid || pod.metadata?.name,
  name: pod.metadata?.name || '-',
  namespace: pod.metadata?.namespace,
  node_name: pod.spec?.nodeName,
  pod_ip: pod.status?.podIP,
  phase: pod.status?.phase,
  ready: getPodReady(pod),
  status: getPodStatus(pod),
  create_time: pod.metadata?.creationTimestamp,
  containers: (pod.spec?.containers || []).map((container) => {
    const status = pod.status?.containerStatuses?.find(
      (item) => item.name === container.name,
    )

    return {
      name: container.name,
      image: container.image,
      status: getContainerStatus(status),
      ready: status?.ready,
      restart_count: status?.restartCount || 0,
      ports: (container.ports || []).map((port) => ({
        name: port.name,
        container_port: port.containerPort,
        protocol: port.protocol,
      })),
      probes: [
        toClusterNodePodProbe(container.readinessProbe, '就绪探针'),
        toClusterNodePodProbe(container.livenessProbe, '存活探针'),
        toClusterNodePodProbe(container.startupProbe, '启动探针'),
      ].filter(Boolean) as API.ClusterNodePodContainerProbe[],
    }
  }),
})

const toClusterNamespaceQuotaItems = (
  quota: KubernetesResourceQuota,
): API.ClusterNamespaceQuotaItem[] => {
  const name = quota.metadata?.name || '-'
  const hard = quota.status?.hard || {}
  const used = quota.status?.used || {}
  const resources = Array.from(
    new Set([...Object.keys(hard), ...Object.keys(used)]),
  )

  return resources.map((resource) => ({
    id: `${quota.metadata?.uid || name}-${resource}`,
    name,
    resource,
    used: used[resource],
    hard: hard[resource],
    create_time: quota.metadata?.creationTimestamp,
  }))
}

const getQuotaResourceValue = (
  quotas: KubernetesResourceQuota[],
  resourceNames: string[],
  field: 'hard' | 'used',
) => {
  for (const quota of quotas) {
    const resources = quota.status?.[field] || {}
    for (const resourceName of resourceNames) {
      if (resources[resourceName]) {
        return resources[resourceName]
      }
    }
  }

  return undefined
}

const toClusterNamespaceQuotaSummary = (
  quotas: KubernetesResourceQuota[],
  limitRanges: KubernetesLimitRange[],
): API.ClusterNamespaceQuotaSummary => {
  const containerLimit = limitRanges
    .flatMap((limitRange) => limitRange.spec?.limits || [])
    .find((limit) => limit.type === 'Container')

  return {
    defaultContainer: {
      cpuRequest: containerLimit?.defaultRequest?.cpu,
      cpuLimit: containerLimit?.default?.cpu,
      memoryRequest: containerLimit?.defaultRequest?.memory,
      memoryLimit: containerLimit?.default?.memory,
    },
    project: {
      cpuLimit: {
        used: getQuotaResourceValue(quotas, ['limits.cpu', 'cpu'], 'used'),
        hard: getQuotaResourceValue(quotas, ['limits.cpu', 'cpu'], 'hard'),
      },
      memoryLimit: {
        used: getQuotaResourceValue(
          quotas,
          ['limits.memory', 'memory'],
          'used',
        ),
        hard: getQuotaResourceValue(
          quotas,
          ['limits.memory', 'memory'],
          'hard',
        ),
      },
      pods: {
        used: getQuotaResourceValue(quotas, ['pods'], 'used'),
        hard: getQuotaResourceValue(quotas, ['pods'], 'hard'),
      },
      deployments: {
        used: getQuotaResourceValue(
          quotas,
          ['count/deployments.apps'],
          'used',
        ),
        hard: getQuotaResourceValue(
          quotas,
          ['count/deployments.apps'],
          'hard',
        ),
      },
      persistentVolumeClaims: {
        used: getQuotaResourceValue(quotas, ['persistentvolumeclaims'], 'used'),
        hard: getQuotaResourceValue(quotas, ['persistentvolumeclaims'], 'hard'),
      },
    },
  }
}

const getResourceCount = async (
  namespace: string,
  path: string,
  clusterId: string,
  options?: { [key: string]: any },
) => {
  const url = path.replace(':namespace', encodeURIComponent(namespace))
  const res = await request<API.ApiResponse<KubernetesResourceList>>(
    url,
    {
      method: 'GET',
      params: { limit: 1 },
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )
  const itemsCount = res.data?.items?.length || 0
  const remainingCount = res.data?.metadata?.remainingItemCount || 0

  return itemsCount + remainingCount
}

const getNamespaceResourceQuotas = async (
  namespace: string,
  clusterId: string,
  options?: { [key: string]: any },
) => {
  const res = await request<API.ApiResponse<KubernetesResourceQuotaList>>(
    `/kapi/v1/namespaces/${encodeURIComponent(namespace)}/resourcequotas`,
    {
      method: 'GET',
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )

  return res.data?.items || []
}

const getNamespaceLimitRanges = async (
  namespace: string,
  clusterId: string,
  options?: { [key: string]: any },
) => {
  const res = await request<API.ApiResponse<KubernetesLimitRangeList>>(
    `/kapi/v1/namespaces/${encodeURIComponent(namespace)}/limitranges`,
    {
      method: 'GET',
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )

  return res.data?.items || []
}

/** 获取命名空间列表 GET /kapi/v1/namespaces */
export async function getClusterNamespaceList(
  params?: API.ClusterNamespaceListParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  if (!clusterId) {
    return {
      code: 20000,
      message: '',
      data: {
        items: [],
        continue: '',
        remainingItemCount: 0,
      },
    } as API.ApiResponse<API.ClusterNamespaceListData>
  }

  const { keyword, ...restParams } = params || {}
  const res = await request<API.ApiResponse<KubernetesNamespaceList>>(
    '/kapi/v1/namespaces',
    {
      method: 'GET',
      params: { ...restParams },
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )

  const normalizedKeyword = keyword?.trim().toLowerCase()
  const items = (res.data?.items || [])
    .map(toClusterNamespaceItem)
    .filter(
      (item) =>
        !normalizedKeyword || item.name.toLowerCase().includes(normalizedKeyword),
    )

  return {
    ...res,
    data: {
      items,
      continue: res.data?.metadata?.continue || '',
      remainingItemCount: res.data?.metadata?.remainingItemCount,
    },
  } as API.ApiResponse<API.ClusterNamespaceListData>
}

/** 获取命名空间详情 GET /kapi/v1/namespaces/:name */
export async function getClusterNamespaceDetail(
  name: string,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  if (!clusterId || !name) {
    return {
      code: 20000,
      message: '',
      data: {
        name,
      },
    } as API.ApiResponse<API.ClusterNamespaceItem>
  }

  const res = await request<API.ApiResponse<KubernetesNamespace>>(
    `/kapi/v1/namespaces/${encodeURIComponent(name)}`,
    {
      method: 'GET',
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )

  return {
    ...res,
    data: toClusterNamespaceItem(res.data || {}),
  } as API.ApiResponse<API.ClusterNamespaceItem>
}

/** 获取命名空间资源状态 GET /kapi/v1/namespaces/:name/* */
export async function getClusterNamespaceResourceStatus(
  namespace: string,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const emptyData = namespaceResourceStatusKeys.reduce(
    (data, key) => ({
      ...data,
      [key]: 0,
    }),
    {} as API.ClusterNamespaceResourceStatus,
  )

  if (!clusterId || !namespace) {
    return {
      code: 20000,
      message: '',
      data: emptyData,
    } as API.ApiResponse<API.ClusterNamespaceResourceStatus>
  }

  const entries = await Promise.all(
    namespaceResourceStatusKeys.map(async (key) => [
      key,
      await getResourceCount(
        namespace,
        namespaceResourceStatusPaths[key],
        clusterId,
        options,
      ),
    ]),
  )

  return {
    code: 20000,
    message: '',
    data: Object.fromEntries(
      entries,
    ) as API.ClusterNamespaceResourceStatus,
  } as API.ApiResponse<API.ClusterNamespaceResourceStatus>
}

/** 获取命名空间配额摘要 GET /kapi/v1/namespaces/:name/{resourcequotas,limitranges} */
export async function getClusterNamespaceQuotaSummary(
  namespace: string,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const emptyData = toClusterNamespaceQuotaSummary([], [])

  if (!clusterId || !namespace) {
    return {
      code: 20000,
      message: '',
      data: emptyData,
    } as API.ApiResponse<API.ClusterNamespaceQuotaSummary>
  }

  const [quotas, limitRanges] = await Promise.all([
    getNamespaceResourceQuotas(namespace, clusterId, options),
    getNamespaceLimitRanges(namespace, clusterId, options),
  ])

  return {
    code: 20000,
    message: '',
    data: toClusterNamespaceQuotaSummary(quotas, limitRanges),
  } as API.ApiResponse<API.ClusterNamespaceQuotaSummary>
}

/** 获取命名空间容器组列表 GET /kapi/v1/namespaces/:name/pods */
export async function getClusterNamespacePodList(
  params?: API.ClusterNamespacePodListParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { namespace, ...restParams } = params || {}

  if (!clusterId || !namespace) {
    return {
      code: 20000,
      message: '',
      data: {
        items: [],
        continue: '',
        remainingItemCount: 0,
      },
    } as API.ApiResponse<API.ClusterNodePodListData>
  }

  const res = await request<API.ApiResponse<KubernetesPodList>>(
    `/kapi/v1/namespaces/${encodeURIComponent(namespace)}/pods`,
    {
      method: 'GET',
      params: { ...restParams },
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )

  return {
    ...res,
    data: {
      items: (res.data?.items || []).map(toClusterNodePodItem),
      continue: res.data?.metadata?.continue || '',
      remainingItemCount: res.data?.metadata?.remainingItemCount,
    },
  } as API.ApiResponse<API.ClusterNodePodListData>
}

/** 获取命名空间配额列表 GET /kapi/v1/namespaces/:name/resourcequotas */
export async function getClusterNamespaceQuotaList(
  params?: API.ClusterNamespaceQuotaListParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { namespace, ...restParams } = params || {}

  if (!clusterId || !namespace) {
    return {
      code: 20000,
      message: '',
      data: {
        items: [],
        continue: '',
        remainingItemCount: 0,
      },
    } as API.ApiResponse<API.ClusterNamespaceQuotaListData>
  }

  const res = await request<API.ApiResponse<KubernetesResourceQuotaList>>(
    `/kapi/v1/namespaces/${encodeURIComponent(namespace)}/resourcequotas`,
    {
      method: 'GET',
      params: { ...restParams },
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )

  return {
    ...res,
    data: {
      items: (res.data?.items || []).flatMap(toClusterNamespaceQuotaItems),
      continue: res.data?.metadata?.continue || '',
      remainingItemCount: res.data?.metadata?.remainingItemCount,
    },
  } as API.ApiResponse<API.ClusterNamespaceQuotaListData>
}

/** 创建命名空间 POST /kapi/v1/namespaces */
export async function createClusterNamespace(
  body: API.CreateClusterNamespaceParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  if (!clusterId) {
    return {
      code: 20000,
      message: '',
      data: {},
    } as API.ApiResponse<Record<string, never>>
  }

  return request<API.ApiResponse<KubernetesNamespace>>('/kapi/v1/namespaces', {
    method: 'POST',
    data: {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: body.name,
      },
    },
    ...(options || {}),
    headers: {
      'X-Cluster-ID': clusterId,
      ...options?.headers,
    },
  })
}

/** 删除命名空间 DELETE /kapi/v1/namespaces/:name */
export async function deleteClusterNamespace(
  name: string,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  if (!clusterId) {
    return
  }

  return request<void>(`/kapi/v1/namespaces/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    ...(options || {}),
    headers: {
      'X-Cluster-ID': clusterId,
      ...options?.headers,
    },
  })
}
