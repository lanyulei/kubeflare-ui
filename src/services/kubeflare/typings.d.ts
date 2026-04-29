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

  type ClusterItem = {
    id: number
    name: string
    alias?: string
    provider?: string
    yaml?: string
    remarks?: string
    status: number
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
    provider: string
    yaml: string
    remarks?: string
    status?: number
  }

  type UpdateClusterParams = CreateClusterParams

}
