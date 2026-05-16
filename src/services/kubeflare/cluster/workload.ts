// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

const CURRENT_CLUSTER_STORAGE_KEY = 'kubeflare.currentClusterId'

type KubernetesWorkloadCondition = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastTransitionTime?: string
}

type KubernetesWorkload = {
  metadata?: {
    uid?: string
    name?: string
    namespace?: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
    creationTimestamp?: string
    deletionTimestamp?: string
  }
  spec?: {
    replicas?: number
    selector?: {
      matchLabels?: Record<string, string>
    }
  }
  status?: {
    replicas?: number
    readyReplicas?: number
    availableReplicas?: number
    updatedReplicas?: number
    currentReplicas?: number
    desiredNumberScheduled?: number
    numberReady?: number
    numberAvailable?: number
    updatedNumberScheduled?: number
    conditions?: KubernetesWorkloadCondition[]
  }
}

type KubernetesWorkloadList = {
  items?: KubernetesWorkload[]
}

const workloadResourcePaths: Record<API.ClusterWorkloadType, string> = {
  Deployment: '/kapis/apps/v1/deployments',
  StatefulSet: '/kapis/apps/v1/statefulsets',
  DaemonSet: '/kapis/apps/v1/daemonsets',
}

const namespacedWorkloadResourcePaths: Record<API.ClusterWorkloadType, string> =
  {
    Deployment: '/kapis/apps/v1/namespaces/:namespace/deployments',
    StatefulSet: '/kapis/apps/v1/namespaces/:namespace/statefulsets',
    DaemonSet: '/kapis/apps/v1/namespaces/:namespace/daemonsets',
  }

const workloadDetailResourcePaths: Record<API.ClusterWorkloadType, string> = {
  Deployment: '/kapis/apps/v1/namespaces/:namespace/deployments/:name',
  StatefulSet: '/kapis/apps/v1/namespaces/:namespace/statefulsets/:name',
  DaemonSet: '/kapis/apps/v1/namespaces/:namespace/daemonsets/:name',
}

const workloadTypeLabels: Record<API.ClusterWorkloadType, string> = {
  Deployment: '部署',
  StatefulSet: '有状态副本集',
  DaemonSet: '守护进程集',
}

const getCurrentClusterId = () => {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.localStorage.getItem(CURRENT_CLUSTER_STORAGE_KEY) || undefined
}

const getWorkloadReplicas = (
  workload: KubernetesWorkload,
  type: API.ClusterWorkloadType,
) => {
  if (type === 'DaemonSet') {
    return workload.status?.desiredNumberScheduled || 0
  }
  return workload.spec?.replicas ?? workload.status?.replicas ?? 0
}

const getWorkloadReadyReplicas = (
  workload: KubernetesWorkload,
  type: API.ClusterWorkloadType,
) => {
  if (type === 'DaemonSet') {
    return workload.status?.numberReady || 0
  }
  return workload.status?.readyReplicas || 0
}

const getWorkloadAvailableReplicas = (
  workload: KubernetesWorkload,
  type: API.ClusterWorkloadType,
) => {
  if (type === 'DaemonSet') {
    return workload.status?.numberAvailable || 0
  }
  return workload.status?.availableReplicas || 0
}

const getWorkloadUpdatedReplicas = (
  workload: KubernetesWorkload,
  type: API.ClusterWorkloadType,
) => {
  if (type === 'DaemonSet') {
    return workload.status?.updatedNumberScheduled || 0
  }
  return workload.status?.updatedReplicas ?? workload.status?.currentReplicas ?? 0
}

const getWorkloadStatus = (
  workload: KubernetesWorkload,
  type: API.ClusterWorkloadType,
) => {
  if (workload.metadata?.deletionTimestamp) {
    return 'Terminating'
  }

  const replicas = getWorkloadReplicas(workload, type)
  const readyReplicas = getWorkloadReadyReplicas(workload, type)
  const availableReplicas = getWorkloadAvailableReplicas(workload, type)
  const updatedReplicas = getWorkloadUpdatedReplicas(workload, type)
  const unavailableCondition = workload.status?.conditions?.find(
    (condition) =>
      condition.type === 'Available' && condition.status === 'False',
  )

  if (replicas === 0) {
    return 'Stopped'
  }
  if (
    readyReplicas >= replicas &&
    availableReplicas >= replicas &&
    updatedReplicas >= replicas
  ) {
    return 'Running'
  }
  if (updatedReplicas < replicas && readyReplicas > 0) {
    return 'Updating'
  }
  if (readyReplicas > 0) {
    return 'Progressing'
  }
  return unavailableCondition?.reason || 'Unavailable'
}

const getWorkloadUpdateTime = (workload: KubernetesWorkload) => {
  const conditionTimes = (workload.status?.conditions || [])
    .map((condition) => condition.lastTransitionTime)
    .filter(Boolean) as string[]

  return conditionTimes.sort().at(-1)
}

const toClusterWorkloadItem = (
  workload: KubernetesWorkload,
  type: API.ClusterWorkloadType,
): API.ClusterWorkloadItem => {
  const replicas = getWorkloadReplicas(workload, type)
  const readyReplicas = getWorkloadReadyReplicas(workload, type)
  const availableReplicas = getWorkloadAvailableReplicas(workload, type)
  const updatedReplicas = getWorkloadUpdatedReplicas(workload, type)
  const namespace = workload.metadata?.namespace || '-'
  const name = workload.metadata?.name || '-'

  return {
    id: workload.metadata?.uid || `${type}-${namespace}-${name}`,
    name,
    namespace,
    type,
    type_label: workloadTypeLabels[type],
    status: getWorkloadStatus(workload, type),
    ready: `${readyReplicas}/${replicas}`,
    replicas,
    ready_replicas: readyReplicas,
    available_replicas: availableReplicas,
    updated_replicas: updatedReplicas,
    selector: workload.spec?.selector?.matchLabels,
    labels: workload.metadata?.labels,
    annotations: workload.metadata?.annotations,
    create_time: workload.metadata?.creationTimestamp,
    update_time: getWorkloadUpdateTime(workload),
  }
}

const matchWorkloadKeyword = (
  workload: API.ClusterWorkloadItem,
  keyword?: string,
) => {
  const normalizedKeyword = keyword?.trim().toLowerCase()
  if (!normalizedKeyword) {
    return true
  }

  return [
    workload.name,
    workload.namespace,
    workload.type,
    workload.type_label,
    workload.status,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedKeyword))
}

const getWorkloadListByType = async (
  type: API.ClusterWorkloadType,
  clusterId: string,
  namespace?: string,
  options?: { [key: string]: any },
) => {
  const url = namespace
    ? namespacedWorkloadResourcePaths[type].replace(
        ':namespace',
        encodeURIComponent(namespace),
      )
    : workloadResourcePaths[type]
  const res = await request<API.ApiResponse<KubernetesWorkloadList>>(
    url,
    {
      method: 'GET',
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )

  return (res.data?.items || []).map((item) => toClusterWorkloadItem(item, type))
}

/** 获取工作负载列表 GET /kapis/apps/v1/{deployments,statefulsets,daemonsets} */
export async function getClusterWorkloadList(
  params?: API.ClusterWorkloadListParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  if (!clusterId) {
    return {
      code: 20000,
      message: '',
      data: {
        items: [],
      },
    } as API.ApiResponse<API.ClusterWorkloadListData>
  }

  const workloadTypes = params?.type
    ? [params.type]
    : (Object.keys(workloadResourcePaths) as API.ClusterWorkloadType[])
  const namespace = params?.namespace?.trim() || undefined
  const workloadItems = (
    await Promise.all(
      workloadTypes.map((type) =>
        getWorkloadListByType(type, clusterId, namespace, options),
      ),
    )
  )
    .flat()
    .filter((item) => matchWorkloadKeyword(item, params?.keyword))
    .sort((first, second) =>
      `${first.namespace}/${first.name}`.localeCompare(
        `${second.namespace}/${second.name}`,
      ),
    )

  return {
    code: 20000,
    message: '',
    data: {
      items: workloadItems,
    },
  } as API.ApiResponse<API.ClusterWorkloadListData>
}

/** 获取工作负载详情 GET /kapis/apps/v1/namespaces/:namespace/{deployments,statefulsets,daemonsets}/:name */
export async function getClusterWorkloadDetail(
  params: API.ClusterWorkloadDetailParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { type, namespace, name } = params

  if (!clusterId || !type || !namespace || !name) {
    return {
      code: 20000,
      message: '',
      data: undefined,
    } as API.ApiResponse<API.ClusterWorkloadItem | undefined>
  }

  const url = workloadDetailResourcePaths[type]
    .replace(':namespace', encodeURIComponent(namespace))
    .replace(':name', encodeURIComponent(name))
  const res = await request<API.ApiResponse<KubernetesWorkload>>(url, {
    method: 'GET',
    ...(options || {}),
    headers: {
      'X-Cluster-ID': clusterId,
      ...options?.headers,
    },
  })

  return {
    ...res,
    data: res.data ? toClusterWorkloadItem(res.data, type) : undefined,
  } as API.ApiResponse<API.ClusterWorkloadItem | undefined>
}
