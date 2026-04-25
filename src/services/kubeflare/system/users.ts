// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

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
