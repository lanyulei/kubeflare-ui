// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'
import { getCsrfToken } from '@/utils/auth'

const CURRENT_CLUSTER_STORAGE_KEY = 'kubeflare.currentClusterId'

type RequestOptions = {
  headers?: Record<string, string>
  [key: string]: any
}

const getCurrentClusterId = () => {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.localStorage.getItem(CURRENT_CLUSTER_STORAGE_KEY) || undefined
}

const withClusterHeaders = (options?: RequestOptions): RequestOptions => {
  const clusterId = getCurrentClusterId()
  if (!clusterId) {
    return options || {}
  }

  return {
    ...(options || {}),
    headers: {
      ...(options?.headers || {}),
      'X-Cluster-ID': clusterId,
    },
  }
}

export type AgentStreamEventName =
  | 'agent.answer.delta'
  | 'agent.evidence.created'
  | 'agent.plan.created'
  | 'agent.route.completed'
  | 'agent.run.completed'
  | 'agent.run.created'
  | 'agent.run.failed'
  | 'agent.thinking'
  | 'agent.tool.completed'
  | 'agent.tool.failed'
  | 'agent.tool.started'

export type AgentStreamEvent = {
  assistant_message?: API.AiChatMessageItem
  delta?: string
  error_message?: string
  event: AgentStreamEventName
  evidence?: API.AgentEvidence
  message?: API.AiChatMessageItem
  message_id?: string
  route?: API.AgentRouteResult
  run?: API.AgentRun
  session?: API.AiChatSessionItem
  tool_call?: API.AgentToolCall
  user_message?: API.AiChatMessageItem
}

export async function getAgentList(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.AgentListData>>('/api/v1/agent', {
    method: 'GET',
    ...withClusterHeaders(options || {}),
  })
}

export async function getAgentToolList(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.AgentToolListData>>('/api/v1/agent/tool', {
    method: 'GET',
    ...withClusterHeaders(options || {}),
  })
}

export async function getAgentSkillList(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.AgentSkillListData>>('/api/v1/agent/skill', {
    method: 'GET',
    ...withClusterHeaders(options || {}),
  })
}

export async function reloadAgentRuntime(
  body: API.ReloadAgentRuntimeParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ReloadAgentRuntimeResult>>(
    '/api/v1/agent/tool/reload',
    {
      data: body,
      method: 'POST',
      ...withClusterHeaders(options || {}),
    },
  )
}

export async function routeAgent(
  body: API.RouteAgentParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AgentRouteResult>>('/api/v1/agent/route', {
    data: body,
    method: 'POST',
    ...withClusterHeaders(options || {}),
  })
}

export async function getAgentRunEvidence(
  runID: string,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AgentEvidenceListData>>(
    `/api/v1/agent/run/${runID}/evidence`,
    {
      method: 'GET',
      ...withClusterHeaders(options || {}),
    },
  )
}

export async function createAgentRunStream(
  agentType: API.AgentType,
  body: API.RunAgentParams,
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
  const clusterId = getCurrentClusterId()
  if (clusterId) {
    headers['X-Cluster-ID'] = clusterId
  }

  const response = await fetch(`/api/v1/agent/${agentType}/run/stream`, {
    body: JSON.stringify(body),
    credentials: 'include',
    headers,
    method: 'POST',
    signal: options?.signal,
  })

  if (!response.ok) {
    let errorMessage = `Agent 执行失败(${response.status})`
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

export async function cancelAgentRun(
  runID: string,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AgentRun>>(
    `/api/v1/agent/run/${runID}/cancel`,
    {
      method: 'POST',
      ...withClusterHeaders(options || {}),
    },
  )
}
