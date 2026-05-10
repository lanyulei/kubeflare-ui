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

type KubernetesPodList = {
  metadata?: {
    continue?: string
    remainingItemCount?: number
  }
  items?: KubernetesPod[]
}

const normalizeLogResponse = (response: unknown) => {
  if (typeof response === 'string') {
    return response
  }

  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as API.ApiResponse<unknown>).data

    if (typeof data === 'string') {
      return data
    }

    return data ? JSON.stringify(data, null, 2) : ''
  }

  return response ? String(response) : ''
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
    unschedulable: node.spec?.unschedulable,
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

/** 更新集群节点调度状态 PATCH /kapi/v1/nodes/:name */
export async function updateClusterNodeScheduling(
  name: string,
  params: API.UpdateClusterNodeSchedulingParams,
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

  return request<API.ApiResponse<KubernetesNode>>(
    `/kapi/v1/nodes/${encodeURIComponent(name)}`,
    {
      method: 'PATCH',
      data: {
        spec: {
          unschedulable: params.unschedulable,
        },
      },
      ...(options || {}),
      headers: {
        'Content-Type': 'application/merge-patch+json',
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )
}

/** 更新集群节点标签 PATCH /kapi/v1/nodes/:name */
export async function updateClusterNodeLabels(
  name: string,
  params: API.UpdateClusterNodeLabelsParams,
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

  return request<API.ApiResponse<KubernetesNode>>(
    `/kapi/v1/nodes/${encodeURIComponent(name)}`,
    {
      method: 'PATCH',
      data: {
        metadata: {
          labels: params.labels,
        },
      },
      ...(options || {}),
      headers: {
        'Content-Type': 'application/merge-patch+json',
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )
}

/** 更新集群节点污点 PATCH /kapi/v1/nodes/:name */
export async function updateClusterNodeTaints(
  name: string,
  params: API.UpdateClusterNodeTaintsParams,
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

  return request<API.ApiResponse<KubernetesNode>>(
    `/kapi/v1/nodes/${encodeURIComponent(name)}`,
    {
      method: 'PATCH',
      data: {
        spec: {
          taints: params.taints,
        },
      },
      ...(options || {}),
      headers: {
        'Content-Type': 'application/merge-patch+json',
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )
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

/** 获取集群节点容器日志 GET /kapi/v1/namespaces/{namespace}/pods/{podName}/log */
export async function getClusterNodePodContainerLogs(
  params?: API.ClusterNodePodContainerLogParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { namespace, podName, ...restParams } = params || {}

  if (!clusterId || !namespace || !podName) {
    return ''
  }

  const res = await request<string | API.ApiResponse<unknown>>(
    `/kapi/v1/namespaces/${namespace}/pods/${podName}/log`,
    {
      method: 'GET',
      params: restParams,
      responseType: 'text',
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )

  return normalizeLogResponse(res)
}
