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

  type KubeListMeta = {
    continue?: string
    remainingItemCount?: number
    resourceVersion?: string
    selfLink?: string
  }

  type KubeObjectMeta = {
    creationTimestamp?: string
    name?: string
    namespace?: string
    resourceVersion?: string
    uid?: string
  }

  type ClusterCondition = {
    lastTransitionTime?: string
    lastUpdateTime?: string
    message?: string
    reason?: string
    status: 'True' | 'False' | 'Unknown'
    type: string
  }

  type ClusterItem = {
    apiVersion?: string
    kind?: string
    metadata?: KubeObjectMeta
    spec: {
      config?: string
      connection?: {
        externalKubernetesAPIEndpoint?: string
        kubeconfig?: string
        kubernetesAPIEndpoint?: string
        kubernetesAPIServerPort?: number
        token?: string
        type?: string
      }
      enable?: boolean
      externalKubeAPIEnabled?: boolean
      joinFederation?: boolean
      provider?: string
    }
    status?: {
      conditions?: ClusterCondition[]
      configz?: Record<string, boolean>
      kubernetesVersion?: string
      nodeCount?: number
      region?: string
      uid?: string
      zones?: string[]
    }
  }

  type ClusterList = {
    apiVersion?: string
    items: ClusterItem[]
    kind?: string
    metadata?: KubeListMeta
  }

  type ListClusterKubeflareComV1ClusterParams = {
    allowWatchBookmarks?: boolean
    continue?: string
    fieldSelector?: string
    labelSelector?: string
    limit?: number
    resourceVersion?: string
    resourceVersionMatch?: string
    sendInitialEvents?: boolean
    timeoutSeconds?: number
    watch?: boolean
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

}
