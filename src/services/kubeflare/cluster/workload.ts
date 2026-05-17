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
  apiVersion?: string
  kind?: string
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

type KubernetesOwnerReference = {
  kind?: string
  name?: string
}

type KubernetesRevisionResource = {
  metadata?: {
    name?: string
    annotations?: Record<string, string>
    creationTimestamp?: string
    ownerReferences?: KubernetesOwnerReference[]
  }
  revision?: number
}

type KubernetesRevisionResourceList = {
  items?: KubernetesRevisionResource[]
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

const workloadRevisionResourcePaths: Record<API.ClusterWorkloadType, string> = {
  Deployment: '/kapis/apps/v1/namespaces/:namespace/replicasets',
  StatefulSet: '/kapis/apps/v1/namespaces/:namespace/controllerrevisions',
  DaemonSet: '/kapis/apps/v1/namespaces/:namespace/controllerrevisions',
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

const getWorkloadDetailUrl = (params: API.ClusterWorkloadDetailParams) =>
  workloadDetailResourcePaths[params.type]
    .replace(':namespace', encodeURIComponent(params.namespace))
    .replace(':name', encodeURIComponent(params.name))

const getWorkloadRevisionUrl = (params: API.ClusterWorkloadDetailParams) =>
  workloadRevisionResourcePaths[params.type].replace(
    ':namespace',
    encodeURIComponent(params.namespace),
  )

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

const getRevisionResourceRevision = (
  item: KubernetesRevisionResource,
  type: API.ClusterWorkloadType,
) => {
  if (type === 'Deployment') {
    return Number(item.metadata?.annotations?.['deployment.kubernetes.io/revision'])
  }

  return Number(item.revision)
}

const toClusterWorkloadRevisionItem = (
  item: KubernetesRevisionResource,
  type: API.ClusterWorkloadType,
): API.ClusterWorkloadRevisionItem | undefined => {
  const revision = getRevisionResourceRevision(item, type)

  if (!Number.isFinite(revision) || revision <= 0) {
    return undefined
  }

  return {
    name: item.metadata?.name,
    revision,
    create_time: item.metadata?.creationTimestamp,
  }
}

const matchRevisionOwner = (
  item: KubernetesRevisionResource,
  params: API.ClusterWorkloadDetailParams,
) =>
  item.metadata?.ownerReferences?.some(
    (owner) => owner.kind === params.type && owner.name === params.name,
  )

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

  const url = getWorkloadDetailUrl(params)
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

/** 更新工作负载副本数 PATCH /kapis/apps/v1/namespaces/:namespace/{deployments,statefulsets}/:name */
export async function updateClusterWorkloadReplicas(
  params: API.UpdateClusterWorkloadReplicasParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { type, namespace, name, replicas } = params

  if (!clusterId || !type || !namespace || !name) {
    return {
      code: 20000,
      message: '',
      data: undefined,
    } as API.ApiResponse<API.ClusterWorkloadItem | undefined>
  }

  const url = getWorkloadDetailUrl(params)
  const res = await request<API.ApiResponse<KubernetesWorkload>>(url, {
    method: 'PATCH',
    data: {
      spec: {
        replicas,
      },
    },
    ...(options || {}),
    headers: {
      'Content-Type': 'application/merge-patch+json',
      'X-Cluster-ID': clusterId,
      ...options?.headers,
    },
  })

  return {
    ...res,
    data: res.data ? toClusterWorkloadItem(res.data, type) : undefined,
  } as API.ApiResponse<API.ClusterWorkloadItem | undefined>
}

/** 获取工作负载原始清单 GET /kapis/apps/v1/namespaces/:namespace/{deployments,statefulsets,daemonsets}/:name */
export async function getClusterWorkloadManifest(
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
    } as API.ApiResponse<Record<string, unknown> | undefined>
  }

  const res = await request<API.ApiResponse<Record<string, unknown>>>(
    getWorkloadDetailUrl(params),
    {
      method: 'GET',
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )

  return res as API.ApiResponse<Record<string, unknown> | undefined>
}

/** 获取工作负载修订记录列表 GET /kapis/apps/v1/namespaces/:namespace/{replicasets,controllerrevisions} */
export async function getClusterWorkloadRevisionList(
  params: API.ClusterWorkloadDetailParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { type, namespace, name } = params

  if (!clusterId || !type || !namespace || !name) {
    return {
      code: 20000,
      message: '',
      data: {
        items: [],
      },
    } as API.ApiResponse<API.ClusterWorkloadRevisionListData>
  }

  const res = await request<API.ApiResponse<KubernetesRevisionResourceList>>(
    getWorkloadRevisionUrl(params),
    {
      method: 'GET',
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )

  const revisions = (res.data?.items || [])
    .filter((item) => matchRevisionOwner(item, params))
    .map((item) => toClusterWorkloadRevisionItem(item, type))
    .filter(Boolean) as API.ClusterWorkloadRevisionItem[]

  return {
    ...res,
    data: {
      items: revisions.sort((first, second) => second.revision - first.revision),
    },
  } as API.ApiResponse<API.ClusterWorkloadRevisionListData>
}

/** 更新工作负载清单 PUT /kapis/apps/v1/namespaces/:namespace/{deployments,statefulsets,daemonsets}/:name */
export async function updateClusterWorkloadManifest(
  params: API.UpdateClusterWorkloadManifestParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { type, namespace, name, manifest } = params

  if (!clusterId || !type || !namespace || !name) {
    return {
      code: 20000,
      message: '',
      data: undefined,
    } as API.ApiResponse<API.ClusterWorkloadItem | undefined>
  }

  const res = await request<API.ApiResponse<KubernetesWorkload>>(
    getWorkloadDetailUrl(params),
    {
      method: 'PUT',
      data: manifest,
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )

  return {
    ...res,
    data: res.data ? toClusterWorkloadItem(res.data, type) : undefined,
  } as API.ApiResponse<API.ClusterWorkloadItem | undefined>
}

/** 重新创建工作负载 PATCH /kapis/apps/v1/namespaces/:namespace/{deployments,statefulsets,daemonsets}/:name */
export async function recreateClusterWorkload(
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

  const res = await request<API.ApiResponse<KubernetesWorkload>>(
    getWorkloadDetailUrl(params),
    {
      method: 'PATCH',
      data: {
        spec: {
          template: {
            metadata: {
              annotations: {
                'kubeflare.io/restarted-at': new Date().toISOString(),
              },
            },
          },
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

  return {
    ...res,
    data: res.data ? toClusterWorkloadItem(res.data, type) : undefined,
  } as API.ApiResponse<API.ClusterWorkloadItem | undefined>
}

/** 回退工作负载 POST /kapis/apps/v1/namespaces/:namespace/{deployments,statefulsets,daemonsets}/:name/rollback */
export async function rollbackClusterWorkload(
  params: API.RollbackClusterWorkloadParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { type, namespace, name, target_revision } = params

  if (!clusterId || !type || !namespace || !name) {
    return {
      code: 20000,
      message: '',
      data: undefined,
    } as API.ApiResponse<API.ClusterWorkloadItem | undefined>
  }

  const res = await request<API.ApiResponse<KubernetesWorkload>>(
    `${getWorkloadDetailUrl(params)}/rollback`,
    {
      method: 'POST',
      data: {
        rollbackTo: {
          revision: target_revision,
        },
        revision: target_revision,
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
    data: res.data ? toClusterWorkloadItem(res.data, type) : undefined,
  } as API.ApiResponse<API.ClusterWorkloadItem | undefined>
}

/** 删除工作负载 DELETE /kapis/apps/v1/namespaces/:namespace/{deployments,statefulsets,daemonsets}/:name */
export async function deleteClusterWorkload(
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
    } as API.ApiResponse<Record<string, unknown> | undefined>
  }

  return request<API.ApiResponse<Record<string, unknown>>>(
    getWorkloadDetailUrl(params),
    {
      method: 'DELETE',
      ...(options || {}),
      headers: {
        'X-Cluster-ID': clusterId,
        ...options?.headers,
      },
    },
  )
}
