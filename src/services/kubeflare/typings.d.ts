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
