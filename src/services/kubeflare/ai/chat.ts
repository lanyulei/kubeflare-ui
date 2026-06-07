// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'
import { getCsrfToken } from '@/utils/auth'

export type AiChatStreamEventName =
  | 'message.completed'
  | 'message.created'
  | 'message.delta'
  | 'message.failed'

export type AiChatStreamEvent = {
  assistant_message?: API.AiChatMessageItem
  delta?: string
  error_message?: string
  event: AiChatStreamEventName
  message?: API.AiChatMessageItem
  message_id?: string
  session?: API.AiChatSessionItem
  user_message?: API.AiChatMessageItem
}

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

/** 流式发送 AI 会话消息 POST /api/v1/ai/session/:sessionID/message/stream */
export async function createAiChatMessageStream(
  sessionID: string,
  body: API.CreateAiChatMessageParams,
  options?: { signal?: AbortSignal },
) {
  const csrfToken = getCsrfToken()
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  }

  if (csrfToken) {
    headers['X-Kubeflare-CSRF'] = csrfToken
  }

  const response = await fetch(
    `/api/v1/ai/session/${sessionID}/message/stream`,
    {
      body: JSON.stringify(body),
      credentials: 'include',
      headers,
      method: 'POST',
      signal: options?.signal,
    },
  )

  if (!response.ok) {
    let errorMessage = `消息发送失败(${response.status})`
    try {
      const payload = await response.json()
      if (payload?.message) {
        errorMessage = payload.message
      }
    } catch (_error) {
      // ignore non-json error bodies
    }
    throw new Error(errorMessage)
  }

  return response
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
