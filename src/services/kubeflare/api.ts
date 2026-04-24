// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

/** 登录 POST /api/v1/auth/login */
export async function login(
  body: API.LoginParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.LoginData>>('/api/v1/auth/login', {
    method: 'POST',
    data: body,
    ...(options || {}),
  })
}

/** 刷新登录态 POST /api/v1/auth/refresh */
export async function refreshToken(
  body?: API.RefreshTokenParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AuthSession>>('/api/v1/auth/refresh', {
    method: 'POST',
    ...(typeof body === 'undefined' ? {} : { data: body }),
    ...(options || {}),
  })
}

/** 退出登录 POST /api/v1/auth/logout */
export async function logout(
  body?: API.LogoutParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<Record<string, never>>>('/api/v1/auth/logout', {
    method: 'POST',
    ...(typeof body === 'undefined' ? {} : { data: body }),
    ...(options || {}),
  })
}

/** 获取图形验证码 GET /api/v1/auth/captcha */
export async function getCaptcha(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.CaptchaData>>('/api/v1/auth/captcha', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 获取当前用户 GET /api/v1/user/me */
export async function currentUser(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.CurrentUser>>('/api/v1/user/me', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 修改当前用户 PUT /api/v1/user/me */
export async function updateCurrentUser(
  body: API.UpdateCurrentUserParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.CurrentUser>>('/api/v1/user/me', {
    method: 'PUT',
    data: body,
    ...(options || {}),
  })
}

/** 修改当前用户密码 PUT /api/v1/user/me/password */
export async function updateCurrentUserPassword(
  body: API.UpdateCurrentUserPasswordParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<Record<string, never>>>(
    '/api/v1/user/me/password',
    {
      method: 'PUT',
      data: body,
      ...(options || {}),
    },
  )
}

/** 开启当前用户 MFA POST /api/v1/user/me/mfa */
export async function setupCurrentUserMfa(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.SetupMfaData>>('/api/v1/user/me/mfa', {
    method: 'POST',
    ...(options || {}),
  })
}

/** 确认当前用户 MFA POST /api/v1/user/me/mfa/confirm */
export async function confirmCurrentUserMfa(
  body: API.ConfirmMfaParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<Record<string, never>>>(
    '/api/v1/user/me/mfa/confirm',
    {
      method: 'POST',
      data: body,
      ...(options || {}),
    },
  )
}

/** 关闭当前用户 MFA DELETE /api/v1/user/me/mfa */
export async function disableCurrentUserMfa(
  body: API.DisableMfaParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<Record<string, never>>>(
    '/api/v1/user/me/mfa',
    {
      method: 'DELETE',
      data: body,
      ...(options || {}),
    },
  )
}

/** 获取用户列表 GET /api/v1/user */
export async function getUserList(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.UserListData>>('/api/v1/user', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 获取用户详情 GET /api/v1/user/:userID */
export async function getUserDetail(
  userID: string | number,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserItem>>(`/api/v1/user/${userID}`, {
    method: 'GET',
    ...(options || {}),
  })
}

/** 创建用户 POST /api/v1/user */
export async function createUser(
  body: API.CreateUserParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserItem>>('/api/v1/user', {
    method: 'POST',
    data: body,
    ...(options || {}),
  })
}

/** 更新用户 PUT /api/v1/user/:userID */
export async function updateUser(
  userID: string | number,
  body: API.UpdateUserParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserItem>>(`/api/v1/user/${userID}`, {
    method: 'PUT',
    data: body,
    ...(options || {}),
  })
}

/** 删除用户 DELETE /api/v1/user/:userID */
export async function deleteUser(
  userID: string | number,
  options?: { [key: string]: any },
) {
  return request<void>(`/api/v1/user/${userID}`, {
    method: 'DELETE',
    ...(options || {}),
  })
}
