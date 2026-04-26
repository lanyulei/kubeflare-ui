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

  type ClusterAuthType =
    | 'bearer_token'
    | 'client_certificate'
    | 'basic'
    | 'auth_provider'
    | 'exec'

  type ClusterItem = {
    id: string
    name: string
    api_endpoint: string
    auth_type: ClusterAuthType
    tls_server_name?: string
    skip_tls_verify: boolean
    proxy_url?: string
    disable_compression: boolean
    impersonate_user?: string
    impersonate_uid?: string
    impersonate_groups?: string
    impersonate_extra?: string
    namespace?: string
    source_context?: string
    source_cluster?: string
    source_user?: string
    default: boolean
    enabled: boolean
    created_at: string
    updated_at: string
  }

  type ClusterListData = {
    items: ClusterItem[]
  }

  type ClusterBaseParams = {
    name: string
    api_endpoint: string
    auth_type?: ClusterAuthType
    upstream_bearer_token?: string
    ca_cert_pem?: string
    client_cert_pem?: string
    client_key_pem?: string
    username?: string
    password?: string
    auth_provider_config?: string
    exec_config?: string
    tls_server_name?: string
    skip_tls_verify?: boolean
    proxy_url?: string
    disable_compression?: boolean
    impersonate_user?: string
    impersonate_uid?: string
    impersonate_groups?: string
    impersonate_extra?: string
    namespace?: string
    source_context?: string
    source_cluster?: string
    source_user?: string
    default?: boolean
    enabled?: boolean
    kubeconfig?: string
    kubeconfig_context?: string
  }

  type CreateClusterParams = ClusterBaseParams

  type UpdateClusterParams = ClusterBaseParams

  type ImportKubeconfigParams = {
    kubeconfig: string
    context_names?: string[]
    default_context?: string
    enabled?: boolean
    skip_unsupported?: boolean
  }

  type ImportKubeconfigData = {
    items: ClusterItem[]
    skipped?: string[]
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
