import type { ChatMessageItem, ChatMessageRole, ChatSession } from '../types';

export const toTimestamp = (value?: string) => {
  if (!value) {
    return Date.now();
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Date.now();
};

export const toChatRole = (role?: API.AiChatMessageRole): ChatMessageRole => {
  if (role === 'user' || role === 'system') {
    return role;
  }
  return 'assistant';
};

export const toChatMessage = (
  message: API.AiChatMessageItem,
): ChatMessageItem => ({
  completionTokens: message.completion_tokens,
  content: message.content || '',
  createdAt: toTimestamp(message.created_at),
  errorMessage: message.error_message,
  id: message.id,
  model: message.model,
  promptTokens: message.prompt_tokens,
  provider: message.provider,
  role: toChatRole(message.role),
  status: message.status,
  totalTokens: message.total_tokens,
});

export const toChatSession = (
  session: API.AiChatSessionItem,
  messages: ChatMessageItem[] = [],
): ChatSession => ({
  createdAt: toTimestamp(session.created_at),
  id: session.id,
  messages,
  summary: session.summary,
  title: session.title || '新会话',
  updatedAt: toTimestamp(session.updated_at || session.created_at),
});

export const toChatSessionDetail = (
  detail: API.AiChatSessionDetail,
): ChatSession =>
  toChatSession(detail, (detail.messages || []).map(toChatMessage));

export const replaceSession = (
  sessions: ChatSession[],
  updatedSession: ChatSession,
) => {
  if (!sessions.some((session) => session.id === updatedSession.id)) {
    return [updatedSession, ...sessions];
  }

  return sessions.map((session) =>
    session.id === updatedSession.id ? updatedSession : session,
  );
};

export const upsertSessionToTop = (
  sessions: ChatSession[],
  updatedSession: ChatSession,
) => [
  updatedSession,
  ...sessions.filter((session) => session.id !== updatedSession.id),
];
