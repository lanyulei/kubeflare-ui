// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

/** 获取 AI 会话列表 GET /api/v1/ai/session */
export async function getAiChatSessionList(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.AiChatSessionListData>>(
    '/api/v1/ai/session',
    {
      method: 'GET',
      ...(options || {}),
    },
  )
}

/** 创建 AI 会话 POST /api/v1/ai/session */
export async function createAiChatSession(
  body?: API.CreateAiChatSessionParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AiChatSessionItem>>(
    '/api/v1/ai/session',
    {
      method: 'POST',
      ...(typeof body === 'undefined' ? {} : { data: body }),
      ...(options || {}),
    },
  )
}

/** 获取 AI 会话详情 GET /api/v1/ai/session/:sessionID */
export async function getAiChatSessionDetail(
  sessionID: string,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AiChatSessionDetail>>(
    `/api/v1/ai/session/${sessionID}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  )
}

/** 更新 AI 会话 PUT /api/v1/ai/session/:sessionID */
export async function updateAiChatSession(
  sessionID: string,
  body: API.UpdateAiChatSessionParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AiChatSessionItem>>(
    `/api/v1/ai/session/${sessionID}`,
    {
      method: 'PUT',
      data: body,
      ...(options || {}),
    },
  )
}

/** 删除 AI 会话 DELETE /api/v1/ai/session/:sessionID */
export async function deleteAiChatSession(
  sessionID: string,
  options?: { [key: string]: any },
) {
  return request<void>(`/api/v1/ai/session/${sessionID}`, {
    method: 'DELETE',
    ...(options || {}),
  })
}

/** 获取 AI 会话消息 GET /api/v1/ai/session/:sessionID/message */
export async function getAiChatMessageList(
  sessionID: string,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AiChatMessageListData>>(
    `/api/v1/ai/session/${sessionID}/message`,
    {
      method: 'GET',
      ...(options || {}),
    },
  )
}

/** 发送 AI 会话消息 POST /api/v1/ai/session/:sessionID/message */
export async function createAiChatMessage(
  sessionID: string,
  body: API.CreateAiChatMessageParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AiChatSessionDetail>>(
    `/api/v1/ai/session/${sessionID}/message`,
    {
      method: 'POST',
      data: body,
      ...(options || {}),
    },
  )
}

/** 取消 AI 消息生成 POST /api/v1/ai/message/:messageID/cancel */
export async function cancelAiChatMessage(
  messageID: string,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AiChatMessageItem>>(
    `/api/v1/ai/message/${messageID}/cancel`,
    {
      method: 'POST',
      ...(options || {}),
    },
  )
}
