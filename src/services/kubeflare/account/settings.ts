// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

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
