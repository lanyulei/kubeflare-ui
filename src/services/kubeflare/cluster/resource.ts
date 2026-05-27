// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

const CURRENT_CLUSTER_STORAGE_KEY = 'kubeflare.currentClusterId'

type KubernetesMetadata = {
  uid?: string
  name?: string
  namespace?: string
  annotations?: Record<string, string>
  creationTimestamp?: string
  deletionTimestamp?: string
}

type KubernetesList<T> = {
  metadata?: {
    continue?: string
    remainingItemCount?: number
  }
  items?: T[]
}

type KubernetesPod = {
  metadata?: KubernetesMetadata
  spec?: {
    nodeName?: string
    volumes?: {
      persistentVolumeClaim?: {
        claimName?: string
      }
    }[]
  }
  status?: {
    phase?: string
    reason?: string
    podIP?: string
    conditions?: {
      lastTransitionTime?: string
    }[]
    containerStatuses?: {
      state?: {
        waiting?: {
          reason?: string
        }
        terminated?: {
          reason?: string
          finishedAt?: string
        }
        running?: {
          startedAt?: string
        }
      }
    }[]
  }
}

type KubernetesJob = {
  metadata?: KubernetesMetadata
  spec?: {
    parallelism?: number
  }
  status?: {
    active?: number
    succeeded?: number
    failed?: number
    startTime?: string
    completionTime?: string
    conditions?: {
      type?: string
      status?: string
      lastTransitionTime?: string
    }[]
  }
}

type KubernetesCronJob = {
  metadata?: KubernetesMetadata
  spec?: {
    schedule?: string
    suspend?: boolean
  }
  status?: {
    active?: unknown[]
    lastScheduleTime?: string
    lastSuccessfulTime?: string
  }
}

type KubernetesService = {
  metadata?: KubernetesMetadata
  spec?: {
    type?: string
    clusterIP?: string
    ports?: {
      name?: string
      port?: number
      nodePort?: number
      protocol?: string
    }[]
  }
  status?: {
    loadBalancer?: {
      ingress?: {
        ip?: string
        hostname?: string
      }[]
    }
  }
}

type KubernetesEndpoints = {
  subsets?: {
    addresses?: KubernetesEndpointAddress[]
    notReadyAddresses?: KubernetesEndpointAddress[]
    ports?: KubernetesEndpointPort[]
  }[]
}

type KubernetesEndpointAddress = {
  ip?: string
  hostname?: string
  nodeName?: string
  targetRef?: {
    kind?: string
    name?: string
    namespace?: string
  }
}

type KubernetesEndpointPort = {
  name?: string
  port?: number
  protocol?: string
}

type KubernetesIngress = {
  metadata?: KubernetesMetadata
  spec?: {
    ingressClassName?: string
  }
  status?: {
    loadBalancer?: {
      ingress?: {
        ip?: string
        hostname?: string
      }[]
    }
  }
}

type KubernetesConfigResource = {
  metadata?: KubernetesMetadata
  type?: string
  data?: Record<string, string>
  binaryData?: Record<string, string>
  stringData?: Record<string, string>
}

type KubernetesServiceAccount = {
  metadata?: KubernetesMetadata
  secrets?: {
    name?: string
  }[]
  imagePullSecrets?: {
    name?: string
  }[]
}

type KubernetesRoleBinding = {
  metadata?: KubernetesMetadata
  roleRef?: {
    kind?: string
    name?: string
  }
  subjects?: {
    kind?: string
    name?: string
    namespace?: string
  }[]
}

type KubernetesCustomResourceDefinition = {
  metadata?: KubernetesMetadata
  spec?: {
    group?: string
    scope?: string
    names?: {
      kind?: string
      plural?: string
      categories?: string[]
    }
    versions?: {
      name?: string
      served?: boolean
    }[]
  }
}

type KubernetesCustomResource = {
  metadata?: KubernetesMetadata
}

type KubernetesPersistentVolumeClaim = {
  metadata?: KubernetesMetadata
  spec?: {
    volumeName?: string
    accessModes?: string[]
    storageClassName?: string
    resources?: {
      requests?: Record<string, string>
    }
  }
  status?: {
    phase?: string
    accessModes?: string[]
    capacity?: Record<string, string>
  }
}

type KubernetesStorageClass = {
  metadata?: KubernetesMetadata
  provisioner?: string
  allowVolumeExpansion?: boolean
  parameters?: Record<string, string>
}

const getCurrentClusterId = () => {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.localStorage.getItem(CURRENT_CLUSTER_STORAGE_KEY) || undefined
}

const emptyListResponse = <T>() =>
  ({
    code: 20000,
    message: '',
    data: {
      items: [] as T[],
      continue: '',
      remainingItemCount: 0,
    },
  }) as API.ApiResponse<API.ClusterResourceListData<T>>

const getClusterHeaders = (
  clusterId: string,
  options?: { [key: string]: any },
) => ({
  'X-Cluster-ID': clusterId,
  ...options?.headers,
})

const getResourceRequestParams = (
  params?: API.ClusterCustomResourceListParams,
) => {
  const {
    keyword: _keyword,
    namespace: _namespace,
    group: _group,
    version: _version,
    plural: _plural,
    scope: _scope,
    ...restParams
  } = params || {}
  return restParams
}

const requestKubernetesList = async <T>(
  path: string,
  params?: API.ClusterCustomResourceListParams,
  options?: { [key: string]: any },
) => {
  const clusterId = getCurrentClusterId()

  if (!clusterId) {
    return undefined
  }

  return request<API.ApiResponse<KubernetesList<T>>>(path, {
    method: 'GET',
    params: getResourceRequestParams(params),
    ...(options || {}),
    headers: getClusterHeaders(clusterId, options),
  })
}

const namespacedResourceListPaths: Partial<
  Record<API.ClusterResourceCreateType, { all: string; namespaced: string }>
> = {
  Job: {
    all: '/kapis/batch/v1/jobs',
    namespaced: '/kapis/batch/v1/namespaces/:namespace/jobs',
  },
  CronJob: {
    all: '/kapis/batch/v1/cronjobs',
    namespaced: '/kapis/batch/v1/namespaces/:namespace/cronjobs',
  },
  Pod: {
    all: '/kapi/v1/pods',
    namespaced: '/kapi/v1/namespaces/:namespace/pods',
  },
  Service: {
    all: '/kapi/v1/services',
    namespaced: '/kapi/v1/namespaces/:namespace/services',
  },
  Ingress: {
    all: '/kapis/networking.k8s.io/v1/ingresses',
    namespaced:
      '/kapis/networking.k8s.io/v1/namespaces/:namespace/ingresses',
  },
  Secret: {
    all: '/kapi/v1/secrets',
    namespaced: '/kapi/v1/namespaces/:namespace/secrets',
  },
  ConfigMap: {
    all: '/kapi/v1/configmaps',
    namespaced: '/kapi/v1/namespaces/:namespace/configmaps',
  },
  ServiceAccount: {
    all: '/kapi/v1/serviceaccounts',
    namespaced: '/kapi/v1/namespaces/:namespace/serviceaccounts',
  },
  PersistentVolumeClaim: {
    all: '/kapi/v1/persistentvolumeclaims',
    namespaced:
      '/kapi/v1/namespaces/:namespace/persistentvolumeclaims',
  },
}

const clusterResourceCreatePaths: Record<API.ClusterResourceCreateType, string> =
  {
    Job: '/kapis/batch/v1/namespaces/:namespace/jobs',
    CronJob: '/kapis/batch/v1/namespaces/:namespace/cronjobs',
    Pod: '/kapi/v1/namespaces/:namespace/pods',
    Service: '/kapi/v1/namespaces/:namespace/services',
    Ingress:
      '/kapis/networking.k8s.io/v1/namespaces/:namespace/ingresses',
    Secret: '/kapi/v1/namespaces/:namespace/secrets',
    ConfigMap: '/kapi/v1/namespaces/:namespace/configmaps',
    ServiceAccount: '/kapi/v1/namespaces/:namespace/serviceaccounts',
    CustomResourceDefinition:
      '/kapis/apiextensions.k8s.io/v1/customresourcedefinitions',
    PersistentVolumeClaim:
      '/kapi/v1/namespaces/:namespace/persistentvolumeclaims',
    StorageClass: '/kapis/storage.k8s.io/v1/storageclasses',
  }

const clusterResourceDetailPaths: Record<API.ClusterResourceCreateType, string> =
  {
    Job: '/kapis/batch/v1/namespaces/:namespace/jobs/:name',
    CronJob: '/kapis/batch/v1/namespaces/:namespace/cronjobs/:name',
    Pod: '/kapi/v1/namespaces/:namespace/pods/:name',
    Service: '/kapi/v1/namespaces/:namespace/services/:name',
    Ingress:
      '/kapis/networking.k8s.io/v1/namespaces/:namespace/ingresses/:name',
    Secret: '/kapi/v1/namespaces/:namespace/secrets/:name',
    ConfigMap: '/kapi/v1/namespaces/:namespace/configmaps/:name',
    ServiceAccount:
      '/kapi/v1/namespaces/:namespace/serviceaccounts/:name',
    CustomResourceDefinition:
      '/kapis/apiextensions.k8s.io/v1/customresourcedefinitions/:name',
    PersistentVolumeClaim:
      '/kapi/v1/namespaces/:namespace/persistentvolumeclaims/:name',
    StorageClass: '/kapis/storage.k8s.io/v1/storageclasses/:name',
  }

const getNamespacedListPath = (
  type: API.ClusterResourceCreateType,
  namespace?: string,
) => {
  const paths = namespacedResourceListPaths[type]

  if (!paths || !namespace?.trim()) {
    return paths?.all
  }

  return paths.namespaced.replace(
    ':namespace',
    encodeURIComponent(namespace.trim()),
  )
}

const getCreateResourcePath = (
  type: API.ClusterResourceCreateType,
  namespace?: string,
) => {
  const path = clusterResourceCreatePaths[type]

  if (!path.includes(':namespace')) {
    return path
  }

  if (!namespace?.trim()) {
    return undefined
  }

  return path.replace(':namespace', encodeURIComponent(namespace.trim()))
}

const getDetailResourcePath = (
  type: API.ClusterResourceCreateType,
  name: string,
  namespace?: string,
) => {
  let path = clusterResourceDetailPaths[type]

  if (!path || !name?.trim()) {
    return undefined
  }

  if (path.includes(':namespace')) {
    if (!namespace?.trim()) {
      return undefined
    }
    path = path.replace(':namespace', encodeURIComponent(namespace.trim()))
  }

  return path.replace(':name', encodeURIComponent(name.trim()))
}

const sleep = (duration: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration)
  })

const isNotFoundError = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status === 404

const waitForClusterResourceDeleted = async (
  params: API.ClusterResourceDetailParams,
  options?: { [key: string]: any },
) => {
  for (let count = 0; count < 20; count += 1) {
    try {
      await getClusterResourceManifest(params, {
        ...(options || {}),
        skipErrorHandler: true,
      })
    } catch (error) {
      if (isNotFoundError(error)) {
        return
      }

      throw error
    }

    await sleep(500)
  }

  throw new Error('等待任务删除超时，请稍后重试')
}

const cleanJobSelectorLabels = (labels?: unknown) => {
  if (!labels || typeof labels !== 'object') {
    return labels
  }

  const {
    'batch.kubernetes.io/controller-uid': _batchControllerUid,
    'controller-uid': _controllerUid,
    ...restLabels
  } = labels as Record<string, unknown>

  return restLabels
}

const buildRerunJobManifest = (
  manifest: Record<string, unknown>,
  namespace: string,
  name: string,
) => {
  const clonedManifest = JSON.parse(JSON.stringify(manifest)) as Record<
    string,
    any
  >
  const metadata = (clonedManifest.metadata || {}) as Record<string, unknown>
  const spec = (clonedManifest.spec || {}) as Record<string, any>
  const template = (spec.template || {}) as Record<string, any>
  const templateMetadata = (template.metadata || {}) as Record<string, unknown>

  delete clonedManifest.status
  delete metadata.creationTimestamp
  delete metadata.deletionGracePeriodSeconds
  delete metadata.deletionTimestamp
  delete metadata.finalizers
  delete metadata.generation
  delete metadata.managedFields
  delete metadata.resourceVersion
  delete metadata.selfLink
  delete metadata.uid
  delete spec.selector

  metadata.name = name
  metadata.namespace = namespace
  metadata.labels = cleanJobSelectorLabels(metadata.labels)
  templateMetadata.labels = cleanJobSelectorLabels(templateMetadata.labels)

  clonedManifest.metadata = metadata
  spec.template = {
    ...template,
    metadata: templateMetadata,
  }
  clonedManifest.spec = spec

  return clonedManifest
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

const getConfigResourceKeys = (
  ...dataList: (Record<string, string> | undefined)[]
) =>
  Array.from(
    new Set(dataList.flatMap((data) => (data ? Object.keys(data) : []))),
  ).sort((first, second) => first.localeCompare(second))

const getLatestTime = (...values: (string | undefined)[]) =>
  values.filter(Boolean).sort().at(-1)

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

const getPodUpdateTime = (pod: KubernetesPod) =>
  getLatestTime(
    ...(pod.status?.conditions || []).map(
      (condition) => condition.lastTransitionTime,
    ),
    ...(pod.status?.containerStatuses || []).flatMap((status) => [
      status.state?.running?.startedAt,
      status.state?.terminated?.finishedAt,
    ]),
  )

const getJobStatus = (job: KubernetesJob) => {
  if (job.metadata?.deletionTimestamp) {
    return 'Terminating'
  }
  const condition = job.status?.conditions?.find(
    (item) => item.status === 'True',
  )

  if (condition?.type) {
    return condition.type
  }
  if (job.status?.active) {
    return 'Running'
  }
  if (job.status?.succeeded) {
    return 'Complete'
  }
  if (job.status?.failed) {
    return 'Failed'
  }
  return 'Pending'
}

const getCronJobStatus = (cronJob: KubernetesCronJob) => {
  if (cronJob.metadata?.deletionTimestamp) {
    return 'Terminating'
  }
  if (cronJob.spec?.suspend) {
    return 'Suspended'
  }
  if (cronJob.status?.active?.length) {
    return 'Running'
  }
  return 'Active'
}

const getServiceInternalAccess = (service: KubernetesService) => {
  const clusterIP =
    service.spec?.clusterIP && service.spec.clusterIP !== 'None'
      ? service.spec.clusterIP
      : undefined
  const ports = (service.spec?.ports || [])
    .map((port) => `${port.port || '-'}${port.protocol ? `/${port.protocol}` : ''}`)
    .join('、')

  return clusterIP ? `${clusterIP}${ports ? `:${ports}` : ''}` : undefined
}

const getServiceExternalAccess = (service: KubernetesService) => {
  const loadBalancer = (service.status?.loadBalancer?.ingress || []).map(
    (item) => item.ip || item.hostname,
  )
  const nodePorts = (service.spec?.ports || [])
    .map((port) => port.nodePort)
    .filter(Boolean)
    .map((port) => `NodePort:${port}`)

  return uniqueText([...loadBalancer, ...nodePorts]).join('、') || undefined
}

const toServiceEndpointItem = (
  address: KubernetesEndpointAddress,
  ports: KubernetesEndpointPort[],
  ready: boolean,
  index: number,
): API.ClusterServiceEndpointItem => ({
  id: `${address.ip || address.hostname || '-'}-${index}`,
  ip: address.ip || address.hostname,
  nodeName: address.nodeName,
  targetKind: address.targetRef?.kind,
  targetName: address.targetRef?.name,
  targetNamespace: address.targetRef?.namespace,
  ready,
  ports: ports.map((port) => ({
    name: port.name,
    port: port.port,
    protocol: port.protocol,
  })),
})

const getIngressGatewayAddress = (ingress: KubernetesIngress) =>
  uniqueText(
    (ingress.status?.loadBalancer?.ingress || []).map(
      (item) => item.ip || item.hostname,
    ),
  ).join('、') || undefined

const getServiceAccountRoleMap = async (
  options?: { [key: string]: any },
) => {
  const [roleBindingsRes, clusterRoleBindingsRes] = await Promise.all([
    requestKubernetesList<KubernetesRoleBinding>(
      '/kapis/rbac.authorization.k8s.io/v1/rolebindings',
      undefined,
      options,
    ),
    requestKubernetesList<KubernetesRoleBinding>(
      '/kapis/rbac.authorization.k8s.io/v1/clusterrolebindings',
      undefined,
      options,
    ),
  ])
  const roleMap = new Map<string, Set<string>>()

  const appendRole = (
    subjectNamespace: string | undefined,
    subjectName: string | undefined,
    role: string | undefined,
  ) => {
    if (!subjectNamespace || !subjectName || !role) {
      return
    }

    const key = `${subjectNamespace}/${subjectName}`
    const roles = roleMap.get(key) || new Set<string>()
    roles.add(role)
    roleMap.set(key, roles)
  }

  ;[
    ...(roleBindingsRes?.data?.items || []),
    ...(clusterRoleBindingsRes?.data?.items || []),
  ].forEach((binding) => {
    const role = binding.roleRef?.name
      ? `${binding.roleRef.kind || 'Role'}:${binding.roleRef.name}`
      : undefined

    ;(binding.subjects || []).forEach((subject) => {
      if (subject.kind !== 'ServiceAccount') {
        return
      }

      appendRole(
        subject.namespace || binding.metadata?.namespace,
        subject.name,
        role,
      )
    })
  })

  return roleMap
}

const getMountedPersistentVolumeClaims = async (
  options?: { [key: string]: any },
) => {
  const podsRes = await requestKubernetesList<KubernetesPod>(
    '/kapi/v1/pods',
    undefined,
    options,
  )
  const mountedClaims = new Set<string>()

  ;(podsRes?.data?.items || []).forEach((pod) => {
    ;(pod.spec?.volumes || []).forEach((volume) => {
      const claimName = volume.persistentVolumeClaim?.claimName

      if (pod.metadata?.namespace && claimName) {
        mountedClaims.add(`${pod.metadata.namespace}/${claimName}`)
      }
    })
  })

  return mountedClaims
}

const getPersistentVolumeClaimCounts = async (
  options?: { [key: string]: any },
) => {
  const pvcRes = await requestKubernetesList<KubernetesPersistentVolumeClaim>(
    '/kapi/v1/persistentvolumeclaims',
    undefined,
    options,
  )
  const counts = new Map<string, number>()

  ;(pvcRes?.data?.items || []).forEach((pvc) => {
    const storageClassName = pvc.spec?.storageClassName

    if (storageClassName) {
      counts.set(storageClassName, (counts.get(storageClassName) || 0) + 1)
    }
  })

  return counts
}

const toJobItem = (job: KubernetesJob): API.ClusterJobItem => ({
  id: job.metadata?.uid || `${job.metadata?.namespace || '-'}-${job.metadata?.name}`,
  name: job.metadata?.name || '-',
  namespace: job.metadata?.namespace,
  status: getJobStatus(job),
  last_run_time: getLatestTime(
    job.status?.completionTime,
    job.status?.startTime,
    ...(job.status?.conditions || []).map(
      (condition) => condition.lastTransitionTime,
    ),
  ),
})

const toCronJobItem = (
  cronJob: KubernetesCronJob,
): API.ClusterCronJobItem => ({
  id:
    cronJob.metadata?.uid ||
    `${cronJob.metadata?.namespace || '-'}-${cronJob.metadata?.name}`,
  name: cronJob.metadata?.name || '-',
  namespace: cronJob.metadata?.namespace,
  status: getCronJobStatus(cronJob),
  schedule: cronJob.spec?.schedule,
  create_time: cronJob.metadata?.creationTimestamp,
})

const toPodItem = (pod: KubernetesPod): API.ClusterPodItem => ({
  id: pod.metadata?.uid || `${pod.metadata?.namespace || '-'}-${pod.metadata?.name}`,
  name: pod.metadata?.name || '-',
  namespace: pod.metadata?.namespace,
  status: getPodStatus(pod),
  node_name: pod.spec?.nodeName,
  pod_ip: pod.status?.podIP,
  create_time: pod.metadata?.creationTimestamp,
  update_time: getPodUpdateTime(pod),
})

const toServiceItem = (
  service: KubernetesService,
): API.ClusterServiceItem => ({
  id:
    service.metadata?.uid ||
    `${service.metadata?.namespace || '-'}-${service.metadata?.name}`,
  name: service.metadata?.name || '-',
  namespace: service.metadata?.namespace,
  internal_access: getServiceInternalAccess(service),
  external_access: getServiceExternalAccess(service),
  ports: (service.spec?.ports || []).flatMap((port) =>
    port.port
      ? [
          {
            name: port.name,
            port: port.port,
            protocol: port.protocol,
          },
        ]
      : [],
  ),
  create_time: service.metadata?.creationTimestamp,
})

const toIngressItem = (
  ingress: KubernetesIngress,
): API.ClusterIngressItem => ({
  id:
    ingress.metadata?.uid ||
    `${ingress.metadata?.namespace || '-'}-${ingress.metadata?.name}`,
  name: ingress.metadata?.name || '-',
  namespace: ingress.metadata?.namespace,
  gateway_address: getIngressGatewayAddress(ingress),
  ingress_class: ingress.spec?.ingressClassName,
  create_time: ingress.metadata?.creationTimestamp,
})

const toConfigResourceItem = (
  resource: KubernetesConfigResource,
): API.ClusterConfigResourceItem => ({
  id:
    resource.metadata?.uid ||
    `${resource.metadata?.namespace || '-'}-${resource.metadata?.name}`,
  name: resource.metadata?.name || '-',
  namespace: resource.metadata?.namespace,
  type: resource.type,
  keys: getConfigResourceKeys(
    resource.data,
    resource.binaryData,
    resource.stringData,
  ),
  create_time: resource.metadata?.creationTimestamp,
})

const toServiceAccountItem = (
  serviceAccount: KubernetesServiceAccount,
  roleMap: Map<string, Set<string>>,
): API.ClusterServiceAccountItem => {
  const namespace = serviceAccount.metadata?.namespace
  const name = serviceAccount.metadata?.name || '-'
  const secrets = uniqueText([
    ...(serviceAccount.secrets || []).map((secret) => secret.name),
    ...(serviceAccount.imagePullSecrets || []).map((secret) => secret.name),
  ])

  return {
    id: serviceAccount.metadata?.uid || `${namespace || '-'}-${name}`,
    name,
    namespace,
    roles: Array.from(roleMap.get(`${namespace}/${name}`) || []),
    secrets,
    create_time: serviceAccount.metadata?.creationTimestamp,
  }
}

const toCustomResourceDefinitionItem = (
  crd: KubernetesCustomResourceDefinition,
): API.ClusterCustomResourceDefinitionItem => {
  const group = crd.spec?.group
  const servedVersions = (crd.spec?.versions || []).filter(
    (version) => version.served !== false,
  )
  const versions = servedVersions.length ? servedVersions : crd.spec?.versions
  const apiVersions = uniqueText(
    (versions || []).map((version) =>
      group && version.name ? `${group}/${version.name}` : version.name,
    ),
  )

  return {
    id: crd.metadata?.uid || crd.metadata?.name,
    apiVersions,
    category: crd.spec?.names?.categories?.join('、') || group,
    name: crd.metadata?.name || crd.spec?.names?.plural || '-',
    scope: crd.spec?.scope,
    create_time: crd.metadata?.creationTimestamp,
  }
}

const toCustomResourceItem = (
  resource: KubernetesCustomResource,
): API.ClusterCustomResourceItem => ({
  id:
    resource.metadata?.uid ||
    `${resource.metadata?.namespace || '-'}-${resource.metadata?.name}`,
  name: resource.metadata?.name || '-',
  namespace: resource.metadata?.namespace,
  create_time: resource.metadata?.creationTimestamp,
})

const toPersistentVolumeClaimItem = (
  pvc: KubernetesPersistentVolumeClaim,
  mountedClaims: Set<string>,
): API.ClusterPersistentVolumeClaimItem => {
  const namespace = pvc.metadata?.namespace
  const name = pvc.metadata?.name || '-'

  return {
    id: pvc.metadata?.uid || `${namespace || '-'}-${name}`,
    name,
    namespace,
    storageClassName: pvc.spec?.storageClassName,
    capacity: pvc.status?.capacity?.storage || pvc.spec?.resources?.requests?.storage,
    accessModes: pvc.status?.accessModes || pvc.spec?.accessModes || [],
    volume_name: pvc.spec?.volumeName,
    status: pvc.status?.phase,
    mounted: mountedClaims.has(`${namespace}/${name}`),
    create_time: pvc.metadata?.creationTimestamp,
  }
}

const toStorageClassItem = (
  storageClass: KubernetesStorageClass,
  pvcCounts: Map<string, number>,
): API.ClusterStorageClassItem => {
  const name = storageClass.metadata?.name || '-'

  return {
    name,
    provisioner: storageClass.provisioner,
    storage_type: storageClass.parameters?.type || storageClass.provisioner,
    persistent_volume_claim_count: pvcCounts.get(name) || 0,
    allow_volume_expansion: storageClass.allowVolumeExpansion,
  }
}

const sortByNamespaceAndName = <T extends { namespace?: string; name: string }>(
  items: T[],
) =>
  items.sort((first, second) =>
    `${first.namespace || ''}/${first.name}`.localeCompare(
      `${second.namespace || ''}/${second.name}`,
    ),
  )

const buildResourceListResponse = <T>(
  res: API.ApiResponse<KubernetesList<unknown>> | undefined,
  items: T[],
) =>
  ({
    ...(res || { code: 20000, message: '' }),
    data: {
      items,
      continue: res?.data?.metadata?.continue || '',
      remainingItemCount: res?.data?.metadata?.remainingItemCount,
    },
  }) as API.ApiResponse<API.ClusterResourceListData<T>>

export async function getClusterJobList(
  params?: API.ClusterResourceListParams,
  options?: { [key: string]: any },
) {
  const res = await requestKubernetesList<KubernetesJob>(
    getNamespacedListPath('Job', params?.namespace) || '/kapis/batch/v1/jobs',
    params,
    options,
  )

  if (!res) {
    return emptyListResponse<API.ClusterJobItem>()
  }

  const items = sortByNamespaceAndName(
    (res.data?.items || []).map(toJobItem).filter((item) =>
      includeKeyword(params?.keyword, [
        item.name,
        item.namespace,
        item.status,
      ]),
    ),
  )

  return buildResourceListResponse(res, items)
}

export async function getClusterCronJobList(
  params?: API.ClusterResourceListParams,
  options?: { [key: string]: any },
) {
  const res = await requestKubernetesList<KubernetesCronJob>(
    getNamespacedListPath('CronJob', params?.namespace) ||
      '/kapis/batch/v1/cronjobs',
    params,
    options,
  )

  if (!res) {
    return emptyListResponse<API.ClusterCronJobItem>()
  }

  const items = sortByNamespaceAndName(
    (res.data?.items || []).map(toCronJobItem).filter((item) =>
      includeKeyword(params?.keyword, [
        item.name,
        item.namespace,
        item.status,
        item.schedule,
      ]),
    ),
  )

  return buildResourceListResponse(res, items)
}

export async function getClusterPodList(
  params?: API.ClusterResourceListParams,
  options?: { [key: string]: any },
) {
  const res = await requestKubernetesList<KubernetesPod>(
    getNamespacedListPath('Pod', params?.namespace) || '/kapi/v1/pods',
    params,
    options,
  )

  if (!res) {
    return emptyListResponse<API.ClusterPodItem>()
  }

  const items = sortByNamespaceAndName(
    (res.data?.items || []).map(toPodItem).filter((item) =>
      includeKeyword(params?.keyword, [
        item.name,
        item.namespace,
        item.status,
        item.node_name,
        item.pod_ip,
      ]),
    ),
  )

  return buildResourceListResponse(res, items)
}

export async function createClusterResource(
  params: API.CreateClusterResourceParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { type, namespace, manifest } = params
  const url = getCreateResourcePath(type, namespace)

  if (!clusterId) {
    throw new Error('请先选择集群')
  }

  if (!type || !url) {
    throw new Error('资源创建参数不完整')
  }

  if (!manifest) {
    throw new Error('资源对象不能为空')
  }

  return request<API.ApiResponse<Record<string, unknown>>>(url, {
    method: 'POST',
    data: manifest,
    ...(options || {}),
    headers: getClusterHeaders(clusterId, options),
  })
}

export async function getClusterResourceManifest(
  params: API.ClusterResourceDetailParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { type, namespace, name } = params
  const url = getDetailResourcePath(type, name, namespace)

  if (!clusterId || !url) {
    return {
      code: 20000,
      message: '',
      data: undefined,
    } as API.ApiResponse<Record<string, unknown> | undefined>
  }

  return request<API.ApiResponse<Record<string, unknown>>>(url, {
    method: 'GET',
    ...(options || {}),
    headers: getClusterHeaders(clusterId, options),
  })
}

export async function updateClusterResourceManifest(
  params: API.UpdateClusterResourceManifestParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { type, namespace, name, manifest } = params
  const url = getDetailResourcePath(type, name, namespace)

  if (!clusterId || !url) {
    return {
      code: 20000,
      message: '',
      data: undefined,
    } as API.ApiResponse<Record<string, unknown> | undefined>
  }

  return request<API.ApiResponse<Record<string, unknown>>>(url, {
    method: 'PUT',
    data: manifest,
    ...(options || {}),
    headers: getClusterHeaders(clusterId, options),
  })
}

export async function deleteClusterResource(
  params: API.ClusterResourceDetailParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { type, namespace, name } = params
  const url = getDetailResourcePath(type, name, namespace)

  if (!clusterId || !url) {
    return {
      code: 20000,
      message: '',
      data: undefined,
    } as API.ApiResponse<Record<string, unknown> | undefined>
  }

  return request<API.ApiResponse<Record<string, unknown>>>(url, {
    method: 'DELETE',
    ...(options || {}),
    headers: getClusterHeaders(clusterId, options),
  })
}

export async function updateClusterJobReplicas(
  params: API.UpdateClusterJobReplicasParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { namespace, name, replicas } = params
  const url = getDetailResourcePath('Job', name, namespace)

  if (!clusterId || !namespace || !url) {
    return {
      code: 20000,
      message: '',
      data: undefined,
    } as API.ApiResponse<Record<string, unknown> | undefined>
  }

  return request<API.ApiResponse<Record<string, unknown>>>(url, {
    method: 'PATCH',
    data: {
      spec: {
        parallelism: replicas,
      },
    },
    ...(options || {}),
    headers: {
      ...getClusterHeaders(clusterId, options),
      'Content-Type': 'application/merge-patch+json',
    },
  })
}

export async function rerunClusterJob(
  params: API.RerunClusterJobParams,
  options?: { [key: string]: any },
) {
  const { namespace, name, manifest } = params

  if (!namespace || !name || !manifest) {
    throw new Error('任务重新运行参数不完整')
  }

  const rerunManifest = buildRerunJobManifest(manifest, namespace, name)

  await deleteClusterResource(
    {
      type: 'Job',
      namespace,
      name,
    },
    {
      ...(options || {}),
      data: {
        propagationPolicy: 'Background',
      },
    },
  )
  await waitForClusterResourceDeleted(
    {
      type: 'Job',
      namespace,
      name,
    },
    options,
  )

  return createClusterResource(
    {
      type: 'Job',
      namespace,
      manifest: rerunManifest,
    },
    options,
  )
}

export async function getClusterServiceList(
  params?: API.ClusterResourceListParams,
  options?: { [key: string]: any },
) {
  const res = await requestKubernetesList<KubernetesService>(
    getNamespacedListPath('Service', params?.namespace) ||
      '/kapi/v1/services',
    params,
    options,
  )

  if (!res) {
    return emptyListResponse<API.ClusterServiceItem>()
  }

  const items = sortByNamespaceAndName(
    (res.data?.items || []).map(toServiceItem).filter((item) =>
      includeKeyword(params?.keyword, [
        item.name,
        item.namespace,
        item.internal_access,
        item.external_access,
      ]),
    ),
  )

  return buildResourceListResponse(res, items)
}

export async function getClusterServiceEndpoints(
  params: API.ClusterServiceEndpointsParams,
  options?: { [key: string]: any },
) {
  const clusterId = getCurrentClusterId()
  const { namespace, name } = params

  if (!clusterId || !namespace || !name) {
    return {
      code: 20000,
      message: '',
      data: {
        items: [],
      },
    } as API.ApiResponse<API.ClusterServiceEndpointsData>
  }

  const res = await request<API.ApiResponse<KubernetesEndpoints>>(
    `/kapi/v1/namespaces/${encodeURIComponent(namespace)}/endpoints/${encodeURIComponent(name)}`,
    {
      method: 'GET',
      ...(options || {}),
      headers: getClusterHeaders(clusterId, options),
    },
  )

  let index = 0
  const items = (res.data?.subsets || []).flatMap((subset) => {
    const ports = subset.ports || []
    const readyItems = (subset.addresses || []).map((address) =>
      toServiceEndpointItem(address, ports, true, index++),
    )
    const notReadyItems = (subset.notReadyAddresses || []).map((address) =>
      toServiceEndpointItem(address, ports, false, index++),
    )

    return [...readyItems, ...notReadyItems]
  })

  return {
    ...res,
    data: {
      items,
    },
  } as API.ApiResponse<API.ClusterServiceEndpointsData>
}

export async function getClusterIngressList(
  params?: API.ClusterResourceListParams,
  options?: { [key: string]: any },
) {
  const res = await requestKubernetesList<KubernetesIngress>(
    getNamespacedListPath('Ingress', params?.namespace) ||
      '/kapis/networking.k8s.io/v1/ingresses',
    params,
    options,
  )

  if (!res) {
    return emptyListResponse<API.ClusterIngressItem>()
  }

  const items = sortByNamespaceAndName(
    (res.data?.items || []).map(toIngressItem).filter((item) =>
      includeKeyword(params?.keyword, [
        item.name,
        item.namespace,
        item.gateway_address,
        item.ingress_class,
      ]),
    ),
  )

  return buildResourceListResponse(res, items)
}

export async function getClusterSecretList(
  params?: API.ClusterResourceListParams,
  options?: { [key: string]: any },
) {
  const res = await requestKubernetesList<KubernetesConfigResource>(
    getNamespacedListPath('Secret', params?.namespace) ||
      '/kapi/v1/secrets',
    params,
    options,
  )

  if (!res) {
    return emptyListResponse<API.ClusterConfigResourceItem>()
  }

  const items = sortByNamespaceAndName(
    (res.data?.items || []).map(toConfigResourceItem).filter((item) =>
      includeKeyword(params?.keyword, [
        item.name,
        item.namespace,
        item.type,
        ...item.keys,
      ]),
    ),
  )

  return buildResourceListResponse(res, items)
}

export async function getClusterConfigMapList(
  params?: API.ClusterResourceListParams,
  options?: { [key: string]: any },
) {
  const res = await requestKubernetesList<KubernetesConfigResource>(
    getNamespacedListPath('ConfigMap', params?.namespace) ||
      '/kapi/v1/configmaps',
    params,
    options,
  )

  if (!res) {
    return emptyListResponse<API.ClusterConfigResourceItem>()
  }

  const items = sortByNamespaceAndName(
    (res.data?.items || []).map(toConfigResourceItem).filter((item) =>
      includeKeyword(params?.keyword, [item.name, item.namespace, ...item.keys]),
    ),
  )

  return buildResourceListResponse(res, items)
}

export async function getClusterServiceAccountList(
  params?: API.ClusterResourceListParams,
  options?: { [key: string]: any },
) {
  const [res, roleMap] = await Promise.all([
    requestKubernetesList<KubernetesServiceAccount>(
      getNamespacedListPath('ServiceAccount', params?.namespace) ||
        '/kapi/v1/serviceaccounts',
      params,
      options,
    ),
    getServiceAccountRoleMap(options),
  ])

  if (!res) {
    return emptyListResponse<API.ClusterServiceAccountItem>()
  }

  const items = sortByNamespaceAndName(
    (res.data?.items || [])
      .map((item) => toServiceAccountItem(item, roleMap))
      .filter((item) =>
        includeKeyword(params?.keyword, [
          item.name,
          item.namespace,
          ...item.roles,
          ...item.secrets,
        ]),
      ),
  )

  return buildResourceListResponse(res, items)
}

export async function getClusterCustomResourceDefinitionList(
  params?: API.ClusterResourceListParams,
  options?: { [key: string]: any },
) {
  const res = await requestKubernetesList<KubernetesCustomResourceDefinition>(
    '/kapis/apiextensions.k8s.io/v1/customresourcedefinitions',
    params,
    options,
  )

  if (!res) {
    return emptyListResponse<API.ClusterCustomResourceDefinitionItem>()
  }

  const items = (res.data?.items || [])
    .map(toCustomResourceDefinitionItem)
    .filter((item) =>
      includeKeyword(params?.keyword, [
        ...item.apiVersions,
        item.category,
        item.name,
        item.scope,
      ]),
    )
    .sort((first, second) => first.name.localeCompare(second.name))

  return buildResourceListResponse(res, items)
}

export async function getClusterCustomResourceList(
  params?: API.ClusterCustomResourceListParams,
  options?: { [key: string]: any },
) {
  const apiGroup = params?.group?.trim()
  const apiVersion = params?.version?.trim()
  const plural = params?.plural?.trim()

  if (!apiVersion || !plural) {
    return emptyListResponse<API.ClusterCustomResourceItem>()
  }

  const rootPath = apiGroup
    ? `/kapis/${encodeURIComponent(apiGroup)}/${encodeURIComponent(apiVersion)}`
    : `/kapi/${encodeURIComponent(apiVersion)}`
  const path =
    params?.scope === 'Namespaced' && params.namespace
      ? `${rootPath}/namespaces/${encodeURIComponent(params.namespace)}/${encodeURIComponent(plural)}`
      : `${rootPath}/${encodeURIComponent(plural)}`
  const res = await requestKubernetesList<KubernetesCustomResource>(
    path,
    params,
    options,
  )

  if (!res) {
    return emptyListResponse<API.ClusterCustomResourceItem>()
  }

  const items = sortByNamespaceAndName(
    (res.data?.items || []).map(toCustomResourceItem).filter((item) =>
      includeKeyword(params?.keyword, [item.name, item.namespace]),
    ),
  )

  return buildResourceListResponse(res, items)
}

export async function getClusterPersistentVolumeClaimList(
  params?: API.ClusterResourceListParams,
  options?: { [key: string]: any },
) {
  const [res, mountedClaims] = await Promise.all([
    requestKubernetesList<KubernetesPersistentVolumeClaim>(
      getNamespacedListPath('PersistentVolumeClaim', params?.namespace) ||
        '/kapi/v1/persistentvolumeclaims',
      params,
      options,
    ),
    getMountedPersistentVolumeClaims(options),
  ])

  if (!res) {
    return emptyListResponse<API.ClusterPersistentVolumeClaimItem>()
  }

  const items = sortByNamespaceAndName(
    (res.data?.items || [])
      .map((item) => toPersistentVolumeClaimItem(item, mountedClaims))
      .filter((item) =>
        includeKeyword(params?.keyword, [
          item.name,
          item.namespace,
          item.status,
          item.volume_name,
          item.storageClassName,
          ...(item.accessModes || []),
        ]),
      ),
  )

  return buildResourceListResponse(res, items)
}

export async function getClusterStorageClassList(
  params?: API.ClusterResourceListParams,
  options?: { [key: string]: any },
) {
  const [res, pvcCounts] = await Promise.all([
    requestKubernetesList<KubernetesStorageClass>(
      '/kapis/storage.k8s.io/v1/storageclasses',
      params,
      options,
    ),
    getPersistentVolumeClaimCounts(options),
  ])

  if (!res) {
    return emptyListResponse<API.ClusterStorageClassItem>()
  }

  const items = (res.data?.items || [])
    .map((item) => toStorageClassItem(item, pvcCounts))
    .filter((item) =>
      includeKeyword(params?.keyword, [
        item.name,
        item.storage_type,
        item.provisioner,
      ]),
    )
    .sort((first, second) => first.name.localeCompare(second.name))

  return buildResourceListResponse(res, items)
}
