// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

const CURRENT_CLUSTER_STORAGE_KEY = 'kubeflare.currentClusterId'

type KubernetesNodeAddress = {
  type?: string
  address?: string
}

type KubernetesNodeCondition = {
  type?: string
  status?: string
}

type KubernetesNodeTaint = {
  key?: string
  value?: string
  effect?: string
}

type KubernetesNode = {
  metadata?: {
    name?: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
    creationTimestamp?: string
  }
  spec?: {
    unschedulable?: boolean
    taints?: KubernetesNodeTaint[]
  }
  status?: {
    addresses?: KubernetesNodeAddress[]
    conditions?: KubernetesNodeCondition[]
    nodeInfo?: {
      architecture?: string
      containerRuntimeVersion?: string
      kernelVersion?: string
      kubeletVersion?: string
      kubeProxyVersion?: string
      operatingSystem?: string
      osImage?: string
    }
  }
}

type KubernetesNodeList = {
  metadata?: {
    continue?: string
    remainingItemCount?: number
  }
  items?: KubernetesNode[]
}

type KubernetesEvent = {
  metadata?: {
    name?: string
    creationTimestamp?: string
  }
  type?: string
  reason?: string
  message?: string
  eventTime?: string
  firstTimestamp?: string
  lastTimestamp?: string
  reportingComponent?: string
  reportingController?: string
  source?: {
    component?: string
    host?: string
  }
}

type KubernetesEventList = {
  metadata?: {
    continue?: string
    remainingItemCount?: number
  }
  items?: KubernetesEvent[]
}

type KubernetesPod = {
  metadata?: {
    uid?: string
    name?: string
    namespace?: string
    creationTimestamp?: string
  }
  spec?: {
    nodeName?: string
  }
  status?: {
    podIP?: string
    phase?: string
  }
}

type KubernetesPodList = {
  metadata?: {
    continue?: string
    remainingItemCount?: number
  }
  items?: KubernetesPod[]
}

const getCurrentClusterId = () => {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.localStorage.getItem(CURRENT_CLUSTER_STORAGE_KEY) || undefined
}

const getNodeAddress = (node: KubernetesNode, type: string) =>
  node.status?.addresses?.find((address) => address.type === type)?.address

const getNodeRoles = (labels?: Record<string, string>) => {
  if (!labels) {
    return []
  }

  const roles = Object.entries(labels)
    .map(([key, value]) => {
      if (key.startsWith('node-role.kubernetes.io/')) {
        return key.replace('node-role.kubernetes.io/', '')
      }
      if (key === 'kubernetes.io/role') {
        return value
      }
      return ''
    })
    .filter(Boolean)

  return roles.length > 0 ? roles : ['worker']
}

const getNodeStatus = (node: KubernetesNode) => {
  if (node.spec?.unschedulable) {
    return 'SchedulingDisabled'
  }
  const readyCondition = node.status?.conditions?.find(
    (condition) => condition.type === 'Ready',
  )
  if (readyCondition?.status === 'True') {
    return 'Ready'
  }
  if (readyCondition?.status === 'Unknown') {
    return 'Unknown'
  }
  return 'NotReady'
}

const getNodeAge = (creationTimestamp?: string) => {
  if (!creationTimestamp) {
    return undefined
  }

  const createdAt = new Date(creationTimestamp).getTime()
  if (!Number.isFinite(createdAt)) {
    return undefined
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000))
  const diffDays = Math.floor(diffSeconds / 86400)
  if (diffDays > 0) {
    return `${diffDays}d`
  }
  const diffHours = Math.floor(diffSeconds / 3600)
  if (diffHours > 0) {
    return `${diffHours}h`
  }
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes > 0) {
    return `${diffMinutes}m`
  }
  return `${diffSeconds}s`
}

const toClusterNodeItem = (node: KubernetesNode): API.ClusterNodeItem => {
  const name = node.metadata?.name || '-'
  const internalIP = getNodeAddress(node, 'InternalIP')
  const externalIP = getNodeAddress(node, 'ExternalIP')

  return {
    id: name,
    name,
    ip: internalIP || externalIP,
    internal_ip: internalIP,
    external_ip: externalIP,
    status: getNodeStatus(node),
    conditions: node.status?.conditions,
    taints: node.spec?.taints,
    labels: node.metadata?.labels,
    annotations: node.metadata?.annotations,
    roles: getNodeRoles(node.metadata?.labels),
    uptime: getNodeAge(node.metadata?.creationTimestamp),
    age: getNodeAge(node.metadata?.creationTimestamp),
    architecture: node.status?.nodeInfo?.architecture,
    container_runtime_version: node.status?.nodeInfo?.containerRuntimeVersion,
    kernel_version: node.status?.nodeInfo?.kernelVersion,
    version: node.status?.nodeInfo?.kubeletVersion,
    kubelet_version: node.status?.nodeInfo?.kubeletVersion,
    kube_proxy_version: node.status?.nodeInfo?.kubeProxyVersion,
    operating_system: node.status?.nodeInfo?.operatingSystem,
    os_image: node.status?.nodeInfo?.osImage,
    create_time: node.metadata?.creationTimestamp,
  }
}

const getEventSource = (event: KubernetesEvent) =>
  event.source?.component ||
  event.reportingComponent ||
  event.reportingController ||
  event.source?.host

const getEventTime = (event: KubernetesEvent) =>
  event.eventTime ||
  event.lastTimestamp ||
  event.firstTimestamp ||
  event.metadata?.creationTimestamp

const toClusterNodeEventItem = (
  event: KubernetesEvent,
): API.ClusterNodeEventItem => ({
  id: event.metadata?.name || `${event.reason || '-'}-${getEventTime(event)}`,
  type: event.type,
  reason: event.reason,
  event_time: getEventTime(event),
  source: getEventSource(event),
  message: event.message,
})

const toClusterNodePodItem = (pod: KubernetesPod): API.ClusterNodePodItem => ({
  id: pod.metadata?.uid || pod.metadata?.name,
  name: pod.metadata?.name || '-',
  namespace: pod.metadata?.namespace,
  node_name: pod.spec?.nodeName,
  pod_ip: pod.status?.podIP,
  phase: pod.status?.phase,
  create_time: pod.metadata?.creationTimestamp,
})

/** 获取集群节点列表 GET /kapi/v1/nodes */
export async function getClusterNodeList(
  params?: API.ClusterNodeListParams,
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
    } as API.ApiResponse<API.ClusterNodeListData>
  }

  const res = await request<API.ApiResponse<KubernetesNodeList>>(
    '/kapi/v1/nodes',
    {
      method: 'GET',
      params: { ...params },
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
      items: (res.data?.items || []).map(toClusterNodeItem),
      continue: res.data?.metadata?.continue || '',
      remainingItemCount: res.data?.metadata?.remainingItemCount,
    },
  } as API.ApiResponse<API.ClusterNodeListData>
}

/** 获取集群节点事件列表 GET /kapi/v1/events */
export async function getClusterNodeEventList(
  params?: API.ClusterNodeEventListParams,
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
    } as API.ApiResponse<API.ClusterNodeEventListData>
  }

  const { nodeName, ...restParams } = params || {}
  const fieldSelector = nodeName
    ? `involvedObject.kind=Node,involvedObject.name=${nodeName}`
    : undefined

  const res = await request<API.ApiResponse<KubernetesEventList>>(
    '/kapi/v1/events',
    {
      method: 'GET',
      params: {
        ...restParams,
        fieldSelector,
      },
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
      items: (res.data?.items || []).map(toClusterNodeEventItem),
      continue: res.data?.metadata?.continue || '',
      remainingItemCount: res.data?.metadata?.remainingItemCount,
    },
  } as API.ApiResponse<API.ClusterNodeEventListData>
}

/** 获取集群节点容器组列表 GET /kapi/v1/pods */
export async function getClusterNodePodList(
  params?: API.ClusterNodePodListParams,
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
    } as API.ApiResponse<API.ClusterNodePodListData>
  }

  const { nodeName, ...restParams } = params || {}
  const fieldSelector = nodeName ? `spec.nodeName=${nodeName}` : undefined

  const res = await request<API.ApiResponse<KubernetesPodList>>(
    '/kapi/v1/pods',
    {
      method: 'GET',
      params: {
        ...restParams,
        fieldSelector,
      },
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
