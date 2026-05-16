// @ts-ignore
/* eslint-disable */

declare namespace API {
  type ApiResponse<T> = {
    code: number
    message: string
    data: T
    request_id?: string
  }

  type UserItem = {
    id: number
    legacy_id?: string
    username: string
    nickname: string
    email?: string
    phone?: string
    avatar?: string
    remarks?: string
    status: number
    mfa_enabled?: boolean
    create_time?: string
    update_time?: string
  }

  type CurrentUser = UserItem

  type AuthSession = {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
    refresh_token_expires_in: number
    session_id: string
    user: CurrentUser
  }

  type LoginData = AuthSession

  type LoginParams = {
    username: string
    password: string
    captcha_id?: string
    captcha_code?: string
    otp_code?: string
  }

  type RefreshTokenParams = {
    refresh_token?: string
  }

  type LogoutParams = {
    refresh_token?: string
    all_sessions?: boolean
  }

  type CaptchaData = {
    id: string
    image_url: string
    expires_in: number
  }

  type UploadFileData = {
    id: string
    type: string
    filename: string
    original_name: string
    content_type: string
    size: number
    url: string
    created_at: string
  }

  type UpdateCurrentUserParams = {
    nickname: string
    email?: string
    phone?: string
    avatar?: string
  }

  type UpdateCurrentUserPasswordParams = {
    old_password: string
    new_password: string
  }

  type SetupMfaData = {
    secret: string
    otp_auth_url: string
  }

  type ConfirmMfaParams = {
    otp_code: string
  }

  type DisableMfaParams = {
    password: string
    otp_code: string
  }

  type UserListData = {
    items: UserItem[]
  }

  type ClusterProvider =
    | 'kubernetes'
    | 'aliyun'
    | 'tencent'
    | 'huawei'
    | 'aws'
    | 'azure'
    | 'google'
    | 'other'
    | 'self_hosted'

  type ClusterItem = {
    id: number
    name: string
    alias?: string
    provider?: ClusterProvider
    yaml?: string
    remarks?: string
    status: number
    test_connection?: boolean
    node_count?: number
    running_state?: string
    version?: string
    message?: string
    create_time?: string
    update_time?: string
    delete_time?: string
  }

  type ClusterListData = {
    items: ClusterItem[]
  }

  type ClusterListParams = {
    keyword?: string
  }

  type ClusterNodeItem = {
    id?: number | string
    name: string
    ip?: string
    internal_ip?: string
    external_ip?: string
    status?: string
    unschedulable?: boolean
    conditions?: ClusterNodeCondition[]
    taints?: ClusterNodeTaint[]
    labels?: Record<string, string>
    annotations?: Record<string, string>
    roles?: string[] | string
    uptime?: string
    age?: string
    architecture?: string
    container_runtime_version?: string
    kernel_version?: string
    version?: string
    kubelet_version?: string
    kube_proxy_version?: string
    operating_system?: string
    os_image?: string
    create_time?: string
  }

  type ClusterNodeCondition = {
    type?: string
    status?: string
  }

  type ClusterNodeTaint = {
    key?: string
    value?: string
    effect?: string
  }

  type ClusterNodeListData = {
    items: ClusterNodeItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterNodeListParams = {
    keyword?: string
    limit?: number
    continue?: string
  }

  type UpdateClusterNodeSchedulingParams = {
    unschedulable: boolean
  }

  type UpdateClusterNodeLabelsParams = {
    labels: Record<string, string | null>
  }

  type UpdateClusterNodeTaintsParams = {
    taints: ClusterNodeTaint[]
  }

  type ClusterNodeEventItem = {
    id?: string
    type?: string
    reason?: string
    event_time?: string
    source?: string
    message?: string
  }

  type ClusterNodeEventListData = {
    items: ClusterNodeEventItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterNodeEventListParams = {
    nodeName?: string
    limit?: number
    continue?: string
  }

  type ClusterNodePodItem = {
    id?: string
    name: string
    namespace?: string
    node_name?: string
    node_ip?: string
    pod_ip?: string
    phase?: string
    ready?: string
    status?: string
    create_time?: string
    containers?: ClusterNodePodContainer[]
  }

  type ClusterNodePodContainer = {
    name?: string
    image?: string
    status?: string
    ready?: boolean
    restart_count?: number
    ports?: ClusterNodePodContainerPort[]
    probes?: ClusterNodePodContainerProbe[]
  }

  type ClusterNodePodContainerPort = {
    name?: string
    container_port?: number
    protocol?: string
  }

  type ClusterNodePodContainerProbe = {
    type?: string
    handler?: string
    detail?: string
    initial_delay_seconds?: number
    timeout_seconds?: number
  }

  type ClusterNodePodListData = {
    items: ClusterNodePodItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterNodePodListParams = {
    nodeName?: string
    limit?: number
    continue?: string
  }

  type ClusterNodePodContainerLogParams = {
    namespace?: string
    podName?: string
    container?: string
    tailLines?: number
    timestamps?: boolean
  }

  type ClusterNamespaceItem = {
    id?: string
    name: string
    status?: string
    conditions?: ClusterNamespaceCondition[]
    labels?: Record<string, string>
    annotations?: Record<string, string>
    create_time?: string
    update_time?: string
  }

  type ClusterNamespaceCondition = {
    type?: string
    status?: string
    reason?: string
    message?: string
    lastTransitionTime?: string
  }

  type ClusterNamespaceListData = {
    items: ClusterNamespaceItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterNamespaceListParams = {
    keyword?: string
    limit?: number
    continue?: string
  }

  type CreateClusterNamespaceParams = {
    name: string
  }

  type UpdateClusterNamespaceAnnotationsParams = {
    annotations: Record<string, string | null>
  }

  type UpdateClusterNamespaceDefaultContainerQuotaParams = {
    cpuRequest?: string
    cpuLimit?: string
    memoryRequest?: string
    memoryLimit?: string
  }

  type UpdateClusterNamespaceProjectQuotaParams = {
    cpuRequest?: string
    cpuLimit?: string
    memoryRequest?: string
    memoryLimit?: string
    storageRequest?: string
    storageLimit?: string
    pods?: string
    deployments?: string
    statefulsets?: string
    daemonsets?: string
    jobs?: string
    cronjobs?: string
    persistentVolumeClaims?: string
    services?: string
    ingresses?: string
    secrets?: string
    configMaps?: string
    storageClassQuotas?: UpdateClusterNamespaceStorageClassQuotaParams[]
  }

  type UpdateClusterNamespaceStorageClassQuotaParams = {
    storageClassName?: string
    requestsStorage?: string
    limitsStorage?: string
    persistentVolumeClaims?: string
  }

  type ClusterNamespaceResourceStatus = {
    pods: number
    deployments: number
    statefulsets: number
    daemonsets: number
    jobs: number
    cronjobs: number
    persistentVolumeClaims: number
    services: number
    ingresses: number
  }

  type ClusterNamespacePodListParams = {
    namespace?: string
    labelSelector?: string
    limit?: number
    continue?: string
  }

  type ClusterNamespaceQuotaItem = {
    id?: string
    name?: string
    resource?: string
    used?: string
    hard?: string
    create_time?: string
  }

  type ClusterNamespaceQuotaListData = {
    items: ClusterNamespaceQuotaItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterNamespaceQuotaListParams = {
    namespace?: string
    limit?: number
    continue?: string
  }

  type ClusterNamespaceDefaultContainerQuota = {
    cpuRequest?: string
    cpuLimit?: string
    memoryRequest?: string
    memoryLimit?: string
  }

  type ClusterNamespaceProjectQuotaValue = {
    used?: string
    hard?: string
  }

  type ClusterNamespaceQuotaSummary = {
    defaultContainer: ClusterNamespaceDefaultContainerQuota
    project: {
      cpuRequest: ClusterNamespaceProjectQuotaValue
      cpuLimit: ClusterNamespaceProjectQuotaValue
      memoryRequest: ClusterNamespaceProjectQuotaValue
      memoryLimit: ClusterNamespaceProjectQuotaValue
      storageRequest: ClusterNamespaceProjectQuotaValue
      storageLimit: ClusterNamespaceProjectQuotaValue
      pods: ClusterNamespaceProjectQuotaValue
      deployments: ClusterNamespaceProjectQuotaValue
      statefulsets: ClusterNamespaceProjectQuotaValue
      daemonsets: ClusterNamespaceProjectQuotaValue
      jobs: ClusterNamespaceProjectQuotaValue
      cronjobs: ClusterNamespaceProjectQuotaValue
      persistentVolumeClaims: ClusterNamespaceProjectQuotaValue
      services: ClusterNamespaceProjectQuotaValue
      ingresses: ClusterNamespaceProjectQuotaValue
      secrets: ClusterNamespaceProjectQuotaValue
      configMaps: ClusterNamespaceProjectQuotaValue
      storageClassQuotas: ClusterNamespaceStorageClassQuota[]
    }
  }

  type ClusterNamespaceStorageClassQuota = {
    storageClassName: string
    requestsStorage?: ClusterNamespaceProjectQuotaValue
    limitsStorage?: ClusterNamespaceProjectQuotaValue
    persistentVolumeClaims?: ClusterNamespaceProjectQuotaValue
  }

  type ClusterWorkloadType = 'Deployment' | 'StatefulSet' | 'DaemonSet'

  type ClusterWorkloadItem = {
    id?: string
    name: string
    namespace?: string
    type: ClusterWorkloadType
    type_label?: string
    status?: string
    ready?: string
    replicas?: number
    ready_replicas?: number
    available_replicas?: number
    updated_replicas?: number
    selector?: Record<string, string>
    labels?: Record<string, string>
    annotations?: Record<string, string>
    create_time?: string
    update_time?: string
  }

  type ClusterWorkloadListData = {
    items: ClusterWorkloadItem[]
  }

  type ClusterWorkloadListParams = {
    keyword?: string
    type?: ClusterWorkloadType
    namespace?: string
  }

  type ClusterWorkloadDetailParams = {
    type: ClusterWorkloadType
    namespace: string
    name: string
  }

  type ClusterStorageClassItem = {
    name: string
    provisioner?: string
  }

  type ClusterStorageClassListData = {
    items: ClusterStorageClassItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterStorageClassListParams = {
    limit?: number
    continue?: string
  }

  type CreateUserParams = {
    username: string
    nickname: string
    password: string
    email?: string
    phone?: string
    avatar?: string
    remarks?: string
    status?: number
  }

  type UpdateUserParams = {
    username: string
    nickname: string
    password?: string
    email?: string
    phone?: string
    avatar?: string
    remarks?: string
    status?: number
  }

  type CreateClusterParams = {
    name: string
    alias?: string
    provider: ClusterProvider
    yaml: string
    remarks?: string
    status?: number
    test_connection?: boolean
  }

  type UpdateClusterParams = CreateClusterParams

}
