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
    objectKind?: string
    objectName?: string
    namespace?: string
    limit?: number
    continue?: string
  }

  type ClusterEventObjectRef = {
    apiVersion?: string
    kind?: string
    namespace?: string
    name?: string
    uid?: string
  }

  type ClusterEventItem = {
    id?: string
    uid?: string
    name?: string
    namespace?: string
    resource_version?: string
    type?: string
    reason?: string
    action?: string
    note?: string
    message?: string
    event_time?: string
    first_timestamp?: string
    last_timestamp?: string
    source?: string
    reporting_controller?: string
    reporting_instance?: string
    regarding?: ClusterEventObjectRef
    related?: ClusterEventObjectRef
    series_count?: number
    series_last_observed_time?: string
    expired?: boolean
    raw?: Record<string, unknown>
  }

  type ClusterEventListData = {
    items: ClusterEventItem[]
    continue?: string
    remainingItemCount?: number
    resourceVersion?: string
  }

  type ClusterEventListParams = {
    namespace?: string
    limit?: number
    continue?: string
    resourceVersion?: string
    type?: string
    regardingKind?: string
    regardingName?: string
    keyword?: string
  }

  type ClusterEventWatchEvent = {
    type?: 'ADDED' | 'MODIFIED' | 'DELETED' | 'BOOKMARK' | 'ERROR' | string
    object?: ClusterEventItem
    resourceVersion?: string
    errorMessage?: string
  }

  type ClusterNodePodItem = {
    id?: string
    name: string
    namespace?: string
    generation?: number
    observed_generation?: number
    node_name?: string
    node_ip?: string
    os_name?: string
    pod_ip?: string
    phase?: string
    qos_class?: string
    ready?: string
    status?: string
    create_time?: string
    containers?: ClusterNodePodContainer[]
    resize_conditions?: ClusterPodResizeCondition[]
    volumes?: ClusterNodePodVolume[]
  }

  type ClusterPodResizeStatus =
    | 'synced'
    | 'pending'
    | 'inProgress'
    | 'deferred'
    | 'infeasible'
    | 'error'
    | 'observing'
    | 'unknown'

  type ClusterPodResizeCondition = {
    type?: string
    status?: string
    reason?: string
    message?: string
    observed_generation?: number
    last_transition_time?: string
  }

  type ClusterNodePodContainer = {
    name?: string
    type?: 'container' | 'initContainer' | 'ephemeralContainer'
    image?: string
    image_pull_policy?: string
    resources?: ClusterNodePodContainerResources
    status_resources?: ClusterNodePodContainerResources
    allocated_resources?: Record<string, string>
    resize_policy?: ClusterNodePodContainerResizePolicy[]
    resize_status?: ClusterPodResizeStatus
    status?: string
    ready?: boolean
    restart_count?: number
    env?: ClusterNodePodContainerEnv[]
    ports?: ClusterNodePodContainerPort[]
    probes?: ClusterNodePodContainerProbe[]
    volume_mounts?: ClusterNodePodContainerVolumeMount[]
  }

  type ClusterNodePodContainerResources = {
    requests?: Record<string, string>
    limits?: Record<string, string>
  }

  type ClusterNodePodContainerResizePolicy = {
    resourceName?: 'cpu' | 'memory'
    restartPolicy?: string
  }

  type ClusterNodePodContainerEnv = {
    name?: string
    value?: string
    value_from?: string
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

  type ClusterNodePodContainerVolumeMount = {
    name?: string
    mount_path?: string
    sub_path?: string
    read_only?: boolean
  }

  type ClusterNodePodVolume = {
    name?: string
    type?: string
    source_name?: string
    source_path?: string
    read_only?: boolean
  }

  type ClusterNodePodListData = {
    items: ClusterNodePodItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterNodePodListParams = {
    nodeName?: string
    namespace?: string
    labelSelector?: string
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

  type CreateClusterWorkloadParams = {
    type: ClusterWorkloadType
    namespace: string
    manifest: Record<string, unknown>
  }

  type UpdateClusterWorkloadReplicasParams = ClusterWorkloadDetailParams & {
    replicas: number
  }

  type UpdateClusterWorkloadManifestParams = ClusterWorkloadDetailParams & {
    manifest: Record<string, unknown>
  }

  type RollbackClusterWorkloadParams = ClusterWorkloadDetailParams & {
    target_revision: number
  }

  type ClusterWorkloadRevisionItem = {
    name?: string
    revision: number
    create_time?: string
  }

  type ClusterWorkloadRevisionListData = {
    items: ClusterWorkloadRevisionItem[]
  }

  type ClusterStorageClassItem = {
    name: string
    provisioner?: string
    storage_type?: string
    persistent_volume_claim_count?: number
    allow_volume_clone?: boolean
    allow_volume_expansion?: boolean
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

  type ClusterPersistentVolumeClaimItem = {
    id?: string
    name: string
    namespace?: string
    storageClassName?: string
    capacity?: string
    accessModes?: string[]
    volume_name?: string
    status?: string
    mounted?: boolean
    create_time?: string
  }

  type ClusterPersistentVolumeClaimListData = {
    items: ClusterPersistentVolumeClaimItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterPersistentVolumeClaimListParams = {
    namespace?: string
    keyword?: string
    limit?: number
    continue?: string
  }

  type ClusterConfigResourceItem = {
    id?: string
    name: string
    namespace?: string
    type?: string
    keys: string[]
    create_time?: string
  }

  type ClusterConfigResourceListData = {
    items: ClusterConfigResourceItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterConfigResourceListParams = {
    namespace?: string
    keyword?: string
    limit?: number
    continue?: string
  }

  type ClusterResourceListData<T> = {
    items: T[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterResourceListParams = {
    keyword?: string
    namespace?: string
    limit?: number
    continue?: string
  }

  type ClusterJobItem = {
    id?: string
    name: string
    namespace?: string
    status?: string
    last_run_time?: string
  }

  type ClusterCronJobItem = {
    id?: string
    name: string
    namespace?: string
    status?: string
    schedule?: string
    create_time?: string
  }

  type ClusterPodItem = {
    id?: string
    name: string
    namespace?: string
    status?: string
    node_name?: string
    pod_ip?: string
    create_time?: string
    update_time?: string
  }

  type ClusterResourceCreateType =
    | 'Job'
    | 'CronJob'
    | 'Pod'
    | 'Service'
    | 'Ingress'
    | 'Secret'
    | 'ConfigMap'
    | 'ServiceAccount'
    | 'Role'
    | 'ClusterRole'
    | 'RoleBinding'
    | 'ClusterRoleBinding'
    | 'CustomResourceDefinition'
    | 'PersistentVolumeClaim'
    | 'StorageClass'

  type CreateClusterResourceParams = {
    type: ClusterResourceCreateType
    namespace?: string
    manifest: Record<string, unknown>
  }

  type ClusterResourceDetailParams = {
    type: ClusterResourceCreateType
    namespace?: string
    name: string
  }

  type UpdateClusterResourceManifestParams = ClusterResourceDetailParams & {
    manifest: Record<string, unknown>
  }

  type UpdateClusterJobReplicasParams = {
    namespace: string
    name: string
    replicas: number
  }

  type UpdateClusterCronJobSuspendParams = {
    namespace: string
    name: string
    suspend: boolean
  }

  type UpdateClusterServicePatchParams = {
    namespace: string
    name: string
    patch: Record<string, unknown>
  }

  type UpdateClusterPersistentVolumeClaimPatchParams = {
    namespace: string
    name: string
    patch: Record<string, unknown>
  }

  type ResizeClusterPodResourcesParams = {
    namespace: string
    name: string
    patch: Record<string, unknown>
  }

  type RerunClusterJobParams = {
    namespace: string
    name: string
    manifest: Record<string, unknown>
  }

  type ClusterServiceItem = {
    id?: string
    name: string
    namespace?: string
    internal_access?: string
    external_access?: string
    ports?: ClusterServicePortItem[]
    create_time?: string
  }

  type ClusterServicePortItem = {
    name?: string
    port?: number
    protocol?: string
  }

  type ClusterServiceEndpointPort = {
    name?: string
    port?: number
    protocol?: string
  }

  type ClusterServiceEndpointItem = {
    id: string
    ip?: string
    nodeName?: string
    targetKind?: string
    targetName?: string
    targetNamespace?: string
    ready?: boolean
    ports?: ClusterServiceEndpointPort[]
  }

  type ClusterServiceEndpointsParams = {
    namespace: string
    name: string
  }

  type ClusterServiceEndpointsData = {
    items: ClusterServiceEndpointItem[]
  }

  type ClusterIngressItem = {
    id?: string
    name: string
    namespace?: string
    gateway_address?: string
    ingress_class?: string
    create_time?: string
  }

  type ClusterServiceAccountItem = {
    id?: string
    name: string
    namespace?: string
    roles: string[]
    secrets: string[]
    imagePullSecrets?: string[]
    mountableSecrets?: string[]
    create_time?: string
  }

  type RbacSubjectKind = 'ServiceAccount' | 'User' | 'Group'

  type RbacRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'

  type RbacPolicyRule = {
    apiGroups?: string[]
    resources?: string[]
    verbs: string[]
    resourceNames?: string[]
    nonResourceURLs?: string[]
  }

  type RbacSubject = {
    kind: RbacSubjectKind
    name: string
    namespace?: string
    apiGroup?: string
  }

  type RbacRoleRef = {
    kind: 'Role' | 'ClusterRole'
    name: string
    apiGroup?: string
  }

  type RbacRoleItem = {
    id?: string
    name: string
    namespace?: string
    type: 'Role' | 'ClusterRole'
    rules: RbacPolicyRule[]
    rule_count: number
    binding_count: number
    subject_count: number
    risk_level: RbacRiskLevel
    risk_reasons: string[]
    system: boolean
    aggregated: boolean
    labels?: Record<string, string>
    annotations?: Record<string, string>
    create_time?: string
    raw?: Record<string, unknown>
  }

  type RbacBindingItem = {
    id?: string
    name: string
    namespace?: string
    type: 'RoleBinding' | 'ClusterRoleBinding'
    subjects: RbacSubject[]
    roleRef?: RbacRoleRef
    role_name?: string
    role_kind?: string
    scope: 'Cluster' | 'Namespace'
    rule_count: number
    risk_level: RbacRiskLevel
    risk_reasons: string[]
    system: boolean
    create_time?: string
    raw?: Record<string, unknown>
  }

  type RbacSubjectItem = {
    id: string
    kind: RbacSubjectKind
    name: string
    namespace?: string
    binding_count: number
    cluster_binding_count: number
    permission_count: number
    risk_level: RbacRiskLevel
    risk_reasons: string[]
  }

  type RbacResolvedPermission = {
    id: string
    subject: RbacSubject
    scope: 'Cluster' | 'Namespace'
    namespace?: string
    rule: RbacPolicyRule
    source: {
      bindingKind: 'RoleBinding' | 'ClusterRoleBinding'
      bindingName: string
      bindingNamespace?: string
      roleKind: 'Role' | 'ClusterRole'
      roleName: string
      roleNamespace?: string
    }
    risk_level: RbacRiskLevel
    risk_reasons: string[]
  }

  type RbacSubjectQuery = {
    kind: RbacSubjectKind
    name: string
    namespace?: string
    scopeNamespace?: string
  }

  type RbacListData<T> = {
    items: T[]
  }

  type ClusterCustomResourceDefinitionItem = {
    id?: string
    apiVersions: string[]
    category?: string
    name: string
    scope?: string
    create_time?: string
  }

  type ClusterCustomResourceItem = {
    id?: string
    name: string
    namespace?: string
    create_time?: string
  }

  type ClusterCustomResourceListParams = ClusterResourceListParams & {
    group?: string
    version?: string
    plural?: string
    scope?: string
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
