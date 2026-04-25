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
