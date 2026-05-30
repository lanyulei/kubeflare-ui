// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

const CURRENT_CLUSTER_STORAGE_KEY = 'kubeflare.currentClusterId'
const EVENT_API_PREFIX = '/kapis/events.k8s.io/v1'

type KubernetesObjectRef = {
  apiVersion?: string
  kind?: string
  namespace?: string
  name?: string
  uid?: string
}

type KubernetesEvent = {
  metadata?: {
    name?: string
    namespace?: string
    uid?: string
    resourceVersion?: string
    creationTimestamp?: string
  }
  type?: string
  reason?: string
  action?: string
  note?: string
  eventTime?: string
  reportingController?: string
  reportingInstance?: string
  regarding?: KubernetesObjectRef
  related?: KubernetesObjectRef
  series?: {
    count?: number
    lastObservedTime?: string
  }
  deprecatedCount?: number
  deprecatedFirstTimestamp?: string
  deprecatedLastTimestamp?: string
  deprecatedSource?: {
    component?: string
    host?: string
  }
}

type KubernetesEventList = {
  metadata?: {
    continue?: string
    remainingItemCount?: number
    resourceVersion?: string
  }
  items?: KubernetesEvent[]
}

type KubernetesWatchPayload = {
  type?: string
  object?: KubernetesEvent & {
    code?: number
    message?: string
    metadata?: KubernetesEvent['metadata']
  }
}

const getCurrentClusterId = () =>
  typeof window === 'undefined'
    ? undefined
    : window.localStorage.getItem(CURRENT_CLUSTER_STORAGE_KEY) || undefined

const getClusterHeaders = (clusterId?: string, headers?: HeadersInit) => ({
  ...(clusterId ? { 'X-Cluster-ID': clusterId } : {}),
  ...(headers || {}),
})

const getEventListPath = (namespace?: string) =>
  namespace?.trim()
    ? `${EVENT_API_PREFIX}/namespaces/${encodeURIComponent(namespace.trim())}/events`
    : `${EVENT_API_PREFIX}/events`

const getEventSource = (event: KubernetesEvent) =>
  event.reportingController ||
  event.reportingInstance ||
  event.deprecatedSource?.component ||
  event.deprecatedSource?.host

const getEventTime = (event: KubernetesEvent) =>
  event.eventTime ||
  event.series?.lastObservedTime ||
  event.deprecatedLastTimestamp ||
  event.deprecatedFirstTimestamp ||
  event.metadata?.creationTimestamp

const toEventObjectRef = (
  ref?: KubernetesObjectRef,
): API.ClusterEventObjectRef | undefined =>
  ref
    ? {
        apiVersion: ref.apiVersion,
        kind: ref.kind,
        namespace: ref.namespace,
        name: ref.name,
        uid: ref.uid,
      }
    : undefined

const toClusterEventItem = (
  event: KubernetesEvent,
): API.ClusterEventItem => ({
  id:
    event.metadata?.uid ||
    event.metadata?.name ||
    `${event.reason || '-'}-${getEventTime(event) || '-'}`,
  uid: event.metadata?.uid,
  name: event.metadata?.name,
  namespace: event.metadata?.namespace || event.regarding?.namespace,
  resource_version: event.metadata?.resourceVersion,
  type: event.type,
  reason: event.reason,
  action: event.action,
  note: event.note,
  message: event.note,
  event_time: getEventTime(event),
  first_timestamp: event.deprecatedFirstTimestamp,
  last_timestamp: event.deprecatedLastTimestamp || event.series?.lastObservedTime,
  source: getEventSource(event),
  reporting_controller: event.reportingController,
  reporting_instance: event.reportingInstance,
  regarding: toEventObjectRef(event.regarding),
  related: toEventObjectRef(event.related),
  series_count: event.series?.count || event.deprecatedCount,
  series_last_observed_time: event.series?.lastObservedTime,
  raw: event as Record<string, unknown>,
})

const getEventRequestParams = (params?: API.ClusterEventListParams) => {
  const { namespace, regardingKind, regardingName, keyword, type, ...rest } =
    params || {}

  return rest
}

export const matchClusterEvent = (
  event: API.ClusterEventItem,
  params?: API.ClusterEventListParams,
) => {
  const keyword = params?.keyword?.trim().toLowerCase()
  const type = params?.type?.trim().toLowerCase()

  if (type && event.type?.toLowerCase() !== type) {
    return false
  }
  if (params?.regardingKind && event.regarding?.kind !== params.regardingKind) {
    return false
  }
  if (params?.regardingName && event.regarding?.name !== params.regardingName) {
    return false
  }
  if (!keyword) {
    return true
  }

  return [
    event.type,
    event.reason,
    event.action,
    event.note,
    event.message,
    event.source,
    event.reporting_controller,
    event.reporting_instance,
    event.namespace,
    event.regarding?.kind,
    event.regarding?.name,
    event.related?.kind,
    event.related?.name,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(keyword))
}

export async function getClusterEventList(
  params?: API.ClusterEventListParams,
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
        resourceVersion: '',
      },
    } as API.ApiResponse<API.ClusterEventListData>
  }

  const res = await request<API.ApiResponse<KubernetesEventList>>(
    getEventListPath(params?.namespace),
    {
      method: 'GET',
      params: getEventRequestParams(params),
      ...(options || {}),
      headers: {
        ...getClusterHeaders(clusterId),
        ...options?.headers,
      },
    },
  )
  const items = (res.data?.items || [])
    .map(toClusterEventItem)
    .filter((item) => matchClusterEvent(item, params))

  return {
    ...res,
    data: {
      items,
      continue: res.data?.metadata?.continue || '',
      remainingItemCount: res.data?.metadata?.remainingItemCount,
      resourceVersion: res.data?.metadata?.resourceVersion || '',
    },
  } as API.ApiResponse<API.ClusterEventListData>
}

const createWatchUrl = (params?: API.ClusterEventListParams) => {
  const url = new URL(getEventListPath(params?.namespace), window.location.origin)
  const requestParams = getEventRequestParams(params)

  Object.entries({
    ...requestParams,
    watch: 'true',
    allowWatchBookmarks: 'true',
    timeoutSeconds: '300',
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return `${url.pathname}${url.search}`
}

const parseWatchLine = (line: string): API.ClusterEventWatchEvent | undefined => {
  if (!line.trim()) {
    return undefined
  }

  const payload = JSON.parse(line) as KubernetesWatchPayload
  const resourceVersion = payload.object?.metadata?.resourceVersion

  if (payload.type === 'BOOKMARK') {
    return {
      type: 'BOOKMARK',
      resourceVersion,
    }
  }
  if (payload.type === 'ERROR') {
    return {
      type: 'ERROR',
      resourceVersion,
      errorMessage: payload.object?.message || '事件 Watch 异常',
    }
  }

  return {
    type: payload.type,
    object: payload.object ? toClusterEventItem(payload.object) : undefined,
    resourceVersion,
  }
}

export const watchClusterEvents = async ({
  onEvent,
  params,
  signal,
}: {
  onEvent: (event: API.ClusterEventWatchEvent) => void
  params?: API.ClusterEventListParams
  signal?: AbortSignal
}) => {
  const clusterId = getCurrentClusterId()
  if (!clusterId) {
    throw new Error('未选择集群')
  }

  const response = await fetch(createWatchUrl(params), {
    credentials: 'include',
    headers: getClusterHeaders(clusterId),
    signal,
  })

  if (!response.ok) {
    throw new Error(`事件 Watch 连接失败(${response.status})`)
  }
  if (!response.body) {
    throw new Error('当前环境不支持事件 Watch 流式读取')
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .getReader()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += value
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const event = parseWatchLine(line)
      if (event) {
        onEvent(event)
      }
    }
  }
}

export type { KubernetesEvent }
