import { message as antdMessage } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  type AgentStreamEvent,
  cancelAgentRun,
  routeAgent,
  submitAgentRunFeedback,
} from '@/services/kubeflare/agent';
import {
  type AiChatStreamEvent,
  cancelAiChatMessage,
  createAiChatSession,
  deleteAiChatSession,
  getAiChatSessionDetail,
  getAiChatSessionList,
} from '@/services/kubeflare/ai/chat';
import { buildAgentDiagnosePrompt, normalizeAgentScope } from '@/utils/agent';
import { applyAgentStreamTimelineEvent } from '@/utils/agentTimeline';
import type { AgentDiagnoseRequest } from '../AgentDiagnoseButton';
import type {
  ChatAgentMode,
  ChatAgentRun,
  ChatMessageItem,
  ChatMessageRole,
  ChatSession,
} from './types';
import { readAgentRunStream } from './utils/agentStream';
import {
  replaceSession,
  toChatMessage,
  toChatSession,
  toChatSessionDetail,
  upsertSessionToTop,
} from './utils/mapper';
import { readAiChatStream } from './utils/stream';

type ChatWindowState = {
  activeSessionId?: string;
  sessions: ChatSession[];
};

type OptimisticMessagePair = {
  assistantMessageId: string;
  sessionId: string;
  userMessageId: string;
};

type APIError = {
  info?: { code?: number; message?: string };
  message?: string;
  response?: { data?: { code?: number; message?: string } };
};

const API_CONFLICT_CODE = 30005;
const LOCAL_MESSAGE_ID_PREFIX = 'local-message';

const upsertMessage = (
  messages: ChatMessageItem[],
  updatedMessage?: ChatMessageItem,
) => {
  if (!updatedMessage) {
    return messages;
  }

  if (!messages.some((message) => message.id === updatedMessage.id)) {
    return [...messages, updatedMessage];
  }

  return messages.map((message) =>
    message.id === updatedMessage.id ? updatedMessage : message,
  );
};

const updateMessage = (
  messages: ChatMessageItem[],
  messageId: string,
  updater: (message: ChatMessageItem) => ChatMessageItem,
) =>
  messages.map((message) =>
    message.id === messageId ? updater(message) : message,
  );

const removeMessages = (messages: ChatMessageItem[], messageIds: string[]) => {
  if (messageIds.length === 0) {
    return messages;
  }
  const messageIdSet = new Set(messageIds);
  return messages.filter((message) => !messageIdSet.has(message.id));
};

const upsertToolCall = (
  toolCalls: API.AgentToolCall[],
  updatedToolCall?: API.AgentToolCall,
) => {
  if (!updatedToolCall) {
    return toolCalls;
  }

  if (!toolCalls.some((toolCall) => toolCall.id === updatedToolCall.id)) {
    return [...toolCalls, updatedToolCall];
  }

  return toolCalls.map((toolCall) =>
    toolCall.id === updatedToolCall.id ? updatedToolCall : toolCall,
  );
};

const upsertEvidence = (
  evidences: API.AgentEvidence[],
  updatedEvidence?: API.AgentEvidence,
) => {
  if (!updatedEvidence) {
    return evidences;
  }

  if (!evidences.some((evidence) => evidence.id === updatedEvidence.id)) {
    return [...evidences, updatedEvidence];
  }

  return evidences.map((evidence) =>
    evidence.id === updatedEvidence.id ? updatedEvidence : evidence,
  );
};

const mergeAgentRun = (
  agentRun: ChatAgentRun | undefined,
  patch: Partial<ChatAgentRun>,
): ChatAgentRun => ({
  evidences: patch.evidences || agentRun?.evidences || [],
  errorMessage: Object.hasOwn(patch, 'errorMessage')
    ? patch.errorMessage
    : agentRun?.errorMessage,
  feedback: Object.hasOwn(patch, 'feedback')
    ? patch.feedback
    : agentRun?.feedback,
  route: patch.route || agentRun?.route,
  run: patch.run || agentRun?.run,
  status: patch.status || agentRun?.status,
  timeline: patch.timeline || agentRun?.timeline || [],
  toolCalls: patch.toolCalls || agentRun?.toolCalls || [],
});

const applyAgentRunFeedback = (
  sessions: ChatSession[],
  runID: string,
  feedback: API.AgentRunFeedback,
) => {
  let changed = false;

  const nextSessions = sessions.map((session) => {
    let sessionChanged = false;
    const messages = session.messages.map((message) => {
      if (message.agentRun?.run?.id !== runID) {
        return message;
      }

      sessionChanged = true;
      return {
        ...message,
        agentRun: mergeAgentRun(message.agentRun, { feedback }),
      };
    });

    if (!sessionChanged) {
      return session;
    }

    changed = true;
    return {
      ...session,
      messages,
    };
  });

  return changed ? nextSessions : sessions;
};

const toAgentScopePayload = (scope: API.AgentScope): API.AgentScope =>
  normalizeAgentScope(scope);

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

const newLocalMessageId = (role: ChatMessageRole) =>
  `${LOCAL_MESSAGE_ID_PREFIX}-${role}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const hasInFlightMessage = (messages: ChatMessageItem[]) =>
  messages.some(
    (message) => message.status === 'pending' || message.status === 'streaming',
  );

const getAPIErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as APIError;
  return (
    apiError.info?.message ||
    apiError.response?.data?.message ||
    apiError.message ||
    fallback
  );
};

// Completion events may carry an empty or stale message; keep the streamed
// answer unless the server has at least as much content.
const pickAgentMessageContent = (
  currentContent: string,
  serverContent?: string,
) => {
  if (!serverContent) {
    return currentContent;
  }
  if (!currentContent) {
    return serverContent;
  }
  return serverContent.length >= currentContent.length
    ? serverContent
    : currentContent;
};

const getNextAgentMessageContent = (
  message: ChatMessageItem,
  event: AgentStreamEvent,
  completedMessage?: ChatMessageItem,
) => {
  if (event.event === 'agent.answer.delta' && event.delta) {
    return `${message.content}${event.delta}`;
  }

  return (
    pickAgentMessageContent(message.content, completedMessage?.content) ||
    event.run?.summary ||
    ''
  );
};

const getNextAgentRunErrorMessage = (
  currentAgentRun: ChatAgentRun | undefined,
  event: AgentStreamEvent,
) => {
  if (event.event === 'agent.run.failed') {
    return (
      event.error_message ||
      event.run?.error_message ||
      currentAgentRun?.errorMessage ||
      'Agent 执行失败'
    );
  }

  if (event.event === 'agent.run.completed') {
    return undefined;
  }

  return currentAgentRun?.errorMessage;
};

const mergeSessionDetail = (
  existingSession: ChatSession | undefined,
  incomingSession: ChatSession,
) => {
  if (
    existingSession &&
    (hasInFlightMessage(existingSession.messages) ||
      existingSession.messages.length > incomingSession.messages.length)
  ) {
    return {
      ...incomingSession,
      messages: existingSession.messages,
    };
  }

  return incomingSession;
};

type UseChatSessionsOptions = {
  connectionStatus?: API.AiConnectionStatus;
  onConfirmAgentRoute?: (route: API.AgentRouteResult) => Promise<boolean>;
  onConnectionStatusChange?: (status: API.AiConnectionStatus) => void;
};

export const useChatSessions = ({
  connectionStatus,
  onConfirmAgentRoute,
  onConnectionStatusChange,
}: UseChatSessionsOptions = {}) => {
  const [chatState, setChatState] = useState<ChatWindowState>({
    sessions: [],
  });
  const [draft, setDraft] = useState('');
  const [agentMode, setAgentMode] = useState<ChatAgentMode>('auto');
  const [agentScope, setAgentScope] = useState<API.AgentScope>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mountedRef = useRef(true);
  const creatingRef = useRef(false);
  const submittingRef = useRef(false);
  const detailRequestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const streamingAgentRunIdRef = useRef<string | undefined>(undefined);
  const streamingMessageIdRef = useRef<string | undefined>(undefined);
  const streamingSessionIdRef = useRef<string | undefined>(undefined);
  const optimisticMessagesRef = useRef<OptimisticMessagePair | undefined>(
    undefined,
  );

  const activeSession = useMemo(
    () =>
      chatState.sessions.find(
        (session) => session.id === chatState.activeSessionId,
      ) || chatState.sessions[0],
    [chatState.activeSessionId, chatState.sessions],
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const loadSessionDetail = useCallback(async (sessionId: string) => {
    const requestId = ++detailRequestRef.current;

    try {
      const res = await getAiChatSessionDetail(sessionId, {
        skipErrorHandler: true,
      });
      if (!mountedRef.current || requestId !== detailRequestRef.current) {
        return;
      }

      const detail = res.data ? toChatSessionDetail(res.data) : undefined;
      if (!detail) {
        return;
      }

      setChatState((prevState) => {
        const existingSession = prevState.sessions.find(
          (session) => session.id === detail.id,
        );
        const mergedDetail = mergeSessionDetail(existingSession, detail);

        return {
          activeSessionId: prevState.activeSessionId || mergedDetail.id,
          sessions: replaceSession(prevState.sessions, mergedDetail),
        };
      });
    } catch (_error) {
      if (mountedRef.current && requestId === detailRequestRef.current) {
        antdMessage.error('加载会话详情失败');
      }
    }
  }, []);

  const createSessionOnServer = useCallback(async () => {
    if (creatingRef.current) {
      return undefined;
    }

    creatingRef.current = true;
    try {
      const res = await createAiChatSession(undefined, {
        skipErrorHandler: true,
      });
      const session = res.data ? toChatSession(res.data) : undefined;

      if (!session || !mountedRef.current) {
        return session;
      }

      setChatState((prevState) => ({
        activeSessionId: session.id,
        sessions: upsertSessionToTop(prevState.sessions, session),
      }));
      return session;
    } catch (_error) {
      antdMessage.error('新建会话失败');
      return undefined;
    } finally {
      creatingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        const res = await getAiChatSessionList({
          skipErrorHandler: true,
        });
        if (!mountedRef.current) {
          return;
        }

        const sessions = (res.data?.items || []).map((session) =>
          toChatSession(session),
        );

        if (sessions.length === 0) {
          await createSessionOnServer();
          return;
        }

        const activeSessionId = sessions[0].id;
        setChatState({
          activeSessionId,
          sessions,
        });
        void loadSessionDetail(activeSessionId);
      } catch (_error) {
        if (mountedRef.current) {
          setChatState({ sessions: [] });
        }
        antdMessage.error('AI 智能助手加载失败');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    void loadSessions();
  }, [createSessionOnServer, loadSessionDetail]);

  const selectSession = useCallback(
    (sessionId: string) => {
      setChatState((prevState) => {
        if (!prevState.sessions.some((session) => session.id === sessionId)) {
          return prevState;
        }

        return {
          ...prevState,
          activeSessionId: sessionId,
        };
      });
      void loadSessionDetail(sessionId);
    },
    [loadSessionDetail],
  );

  const createSession = useCallback(() => {
    setDraft('');
    void createSessionOnServer();
  }, [createSessionOnServer]);

  const applyAgentRequest = useCallback((request: AgentDiagnoseRequest) => {
    const scope = normalizeAgentScope(request.scope);
    const nextAgentMode = request.selectedAgent || 'diagnostic';

    setAgentMode(nextAgentMode);
    setAgentScope(scope);
    setDraft(request.prompt || buildAgentDiagnosePrompt(scope));
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (streamingSessionIdRef.current === sessionId) {
        abortControllerRef.current?.abort();
        streamingAgentRunIdRef.current = undefined;
        streamingMessageIdRef.current = undefined;
        streamingSessionIdRef.current = undefined;
        submittingRef.current = false;
        if (mountedRef.current) {
          setSubmitting(false);
        }
      }

      if (optimisticMessagesRef.current?.sessionId === sessionId) {
        optimisticMessagesRef.current = undefined;
      }

      try {
        await deleteAiChatSession(sessionId, {
          skipErrorHandler: true,
        });

        let nextActiveSessionId: string | undefined;
        let shouldReloadActiveSession = false;
        setChatState((prevState) => {
          const sessions = prevState.sessions.filter(
            (session) => session.id !== sessionId,
          );
          const existingActiveSessionId = sessions.some(
            (session) => session.id === prevState.activeSessionId,
          )
            ? prevState.activeSessionId
            : undefined;
          nextActiveSessionId =
            prevState.activeSessionId === sessionId
              ? sessions[0]?.id
              : existingActiveSessionId || sessions[0]?.id;
          shouldReloadActiveSession = Boolean(
            nextActiveSessionId && prevState.activeSessionId === sessionId,
          );

          return {
            activeSessionId: nextActiveSessionId,
            sessions,
          };
        });
        setDraft('');

        if (nextActiveSessionId && shouldReloadActiveSession) {
          void loadSessionDetail(nextActiveSessionId);
          return;
        }

        if (!nextActiveSessionId) {
          void createSessionOnServer();
        }
      } catch (_error) {
        antdMessage.error('删除会话失败');
      }
    },
    [createSessionOnServer, loadSessionDetail],
  );

  const removeOptimisticMessages = useCallback(
    (pair?: OptimisticMessagePair) => {
      if (!pair) {
        return;
      }

      setChatState((prevState) => ({
        ...prevState,
        sessions: prevState.sessions.map((session) =>
          session.id === pair.sessionId
            ? {
                ...session,
                messages: removeMessages(session.messages, [
                  pair.userMessageId,
                  pair.assistantMessageId,
                ]),
              }
            : session,
        ),
      }));

      if (optimisticMessagesRef.current === pair) {
        optimisticMessagesRef.current = undefined;
      }
    },
    [],
  );

  const appendOptimisticMessages = useCallback(
    (sessionId: string, content: string, agentRun?: ChatAgentRun) => {
      const now = Date.now();
      const userMessageId = newLocalMessageId('user');
      const assistantMessageId = newLocalMessageId('assistant');
      const pair: OptimisticMessagePair = {
        assistantMessageId,
        sessionId,
        userMessageId,
      };
      const userMessage: ChatMessageItem = {
        content,
        createdAt: now,
        id: userMessageId,
        role: 'user',
        status: 'completed',
      };
      const assistantMessage: ChatMessageItem = {
        agentRun,
        content: '',
        createdAt: now,
        id: assistantMessageId,
        role: 'assistant',
        status: 'pending',
      };

      const previousPair = optimisticMessagesRef.current;
      optimisticMessagesRef.current = pair;
      setChatState((prevState) => {
        const existingSession = prevState.sessions.find(
          (session) => session.id === sessionId,
        );
        let messages = existingSession?.messages || [];
        messages = removeMessages(
          messages,
          previousPair && previousPair.sessionId === sessionId
            ? [previousPair.userMessageId, previousPair.assistantMessageId]
            : [],
        );
        messages = upsertMessage(messages, userMessage);
        messages = upsertMessage(messages, assistantMessage);

        const updatedSession = {
          ...(existingSession || {
            createdAt: now,
            id: sessionId,
            title: '新会话',
            updatedAt: now,
          }),
          messages,
          updatedAt: now,
        };

        return {
          activeSessionId: sessionId,
          sessions: upsertSessionToTop(prevState.sessions, updatedSession),
        };
      });

      return pair;
    },
    [],
  );

  const failStreamingMessage = useCallback(
    (sessionId?: string, messageId?: string, errorMessage?: string) => {
      if (!sessionId || !messageId) {
        return;
      }

      setChatState((prevState) => ({
        ...prevState,
        sessions: prevState.sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                messages: updateMessage(
                  session.messages,
                  messageId,
                  (message) => {
                    const nextErrorMessage =
                      errorMessage || '消息生成中断，请重新发送消息';
                    return {
                      ...message,
                      agentRun: message.agentRun
                        ? mergeAgentRun(message.agentRun, {
                            errorMessage: nextErrorMessage,
                            status: 'failed',
                          })
                        : message.agentRun,
                      errorMessage: nextErrorMessage,
                      status: 'failed',
                    };
                  },
                ),
              }
            : session,
        ),
      }));

      if (streamingMessageIdRef.current === messageId) {
        streamingAgentRunIdRef.current = undefined;
        streamingMessageIdRef.current = undefined;
        streamingSessionIdRef.current = undefined;
      }
    },
    [],
  );

  const applyCompletedStreamMessage = useCallback(
    (
      sessionId: string,
      completedMessage: ChatMessageItem,
      completedSession?: API.AiChatSessionItem,
    ) => {
      setChatState((prevState) => {
        const existingSession = prevState.sessions.find(
          (session) => session.id === sessionId,
        );
        if (!existingSession) {
          return prevState;
        }

        const messages = upsertMessage(
          existingSession.messages,
          completedMessage,
        );
        const updatedSession = {
          ...(completedSession
            ? toChatSession(completedSession, messages)
            : existingSession),
          messages,
        };

        return {
          activeSessionId: prevState.activeSessionId || sessionId,
          sessions: upsertSessionToTop(prevState.sessions, updatedSession),
        };
      });
    },
    [],
  );

  const appendStreamDelta = useCallback(
    (sessionId: string, messageId: string, delta?: string) => {
      if (!delta) {
        return;
      }

      setChatState((prevState) => ({
        ...prevState,
        sessions: prevState.sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                messages: updateMessage(
                  session.messages,
                  messageId,
                  (message) => ({
                    ...message,
                    content: `${message.content}${delta}`,
                    status: 'streaming',
                  }),
                ),
              }
            : session,
        ),
      }));
    },
    [],
  );

  const applyStreamEvent = useCallback(
    (sessionId: string, event: AiChatStreamEvent) => {
      if (event.event === 'message.created') {
        const userMessage = event.user_message
          ? toChatMessage(event.user_message)
          : undefined;
        const assistantMessage = event.assistant_message
          ? toChatMessage(event.assistant_message)
          : undefined;
        if (assistantMessage) {
          streamingMessageIdRef.current = assistantMessage.id;
          streamingSessionIdRef.current = sessionId;
        }

        setChatState((prevState) => {
          const existingSession = prevState.sessions.find(
            (session) => session.id === sessionId,
          );
          const optimisticPair = optimisticMessagesRef.current;
          if (
            !existingSession &&
            (!optimisticPair || optimisticPair.sessionId !== sessionId)
          ) {
            return prevState;
          }

          let messages = existingSession?.messages || [];
          messages = removeMessages(
            messages,
            optimisticPair && optimisticPair.sessionId === sessionId
              ? [
                  optimisticPair.userMessageId,
                  optimisticPair.assistantMessageId,
                ]
              : [],
          );
          messages = upsertMessage(messages, userMessage);
          messages = upsertMessage(messages, assistantMessage);

          const updatedSession = {
            ...(event.session
              ? toChatSession(event.session, messages)
              : existingSession || {
                  createdAt: Date.now(),
                  id: sessionId,
                  title: '新会话',
                  updatedAt: Date.now(),
                }),
            messages,
          };

          return {
            activeSessionId: prevState.activeSessionId || sessionId,
            sessions: upsertSessionToTop(prevState.sessions, updatedSession),
          };
        });
        optimisticMessagesRef.current = undefined;
        return;
      }

      if (event.event === 'message.delta' && event.message_id) {
        appendStreamDelta(sessionId, event.message_id, event.delta);
        return;
      }

      if (event.event === 'message.completed' && event.message) {
        const completedMessage = toChatMessage(event.message);
        streamingMessageIdRef.current = undefined;
        streamingSessionIdRef.current = undefined;
        applyCompletedStreamMessage(sessionId, completedMessage, event.session);
        return;
      }

      if (event.event === 'message.failed') {
        const failedMessage = event.message
          ? toChatMessage(event.message)
          : undefined;
        if (event.error_message !== 'generation canceled') {
          onConnectionStatusChange?.('failed');
        }
        streamingMessageIdRef.current = undefined;
        streamingSessionIdRef.current = undefined;

        setChatState((prevState) => ({
          ...prevState,
          sessions: prevState.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: failedMessage
                    ? upsertMessage(session.messages, failedMessage)
                    : updateMessage(
                        session.messages,
                        event.message_id || '',
                        (message) => ({
                          ...message,
                          errorMessage:
                            event.error_message || '消息生成失败，请重试',
                          status: 'failed',
                        }),
                      ),
                }
              : session,
          ),
        }));
      }
    },
    [appendStreamDelta, applyCompletedStreamMessage, onConnectionStatusChange],
  );

  const applyAgentStreamEvent = useCallback(
    (sessionId: string, messageId: string, event: AgentStreamEvent) => {
      const serverUserMessage = event.user_message
        ? toChatMessage(event.user_message)
        : undefined;
      const serverAssistantMessage = event.assistant_message
        ? toChatMessage(event.assistant_message)
        : undefined;
      const completedMessage = event.message
        ? toChatMessage(event.message)
        : undefined;
      const targetMessageId =
        serverAssistantMessage?.id ||
        completedMessage?.id ||
        event.message_id ||
        streamingMessageIdRef.current ||
        messageId;
      const currentOptimisticPair = optimisticMessagesRef.current;

      if (event.run?.id) {
        streamingAgentRunIdRef.current = event.run.id;
      }
      if (serverAssistantMessage) {
        streamingMessageIdRef.current = serverAssistantMessage.id;
        streamingSessionIdRef.current = sessionId;
      }

      const applyStateUpdate = (
        updater: (prevState: ChatWindowState) => ChatWindowState,
      ) => {
        if (event.event === 'agent.answer.delta') {
          flushSync(() => {
            setChatState(updater);
          });
          return;
        }
        setChatState(updater);
      };

      applyStateUpdate((prevState) => ({
        ...prevState,
        sessions: prevState.sessions.map((session) =>
          session.id === sessionId
            ? (() => {
                const optimisticAssistantRun =
                  currentOptimisticPair?.sessionId === sessionId
                    ? session.messages.find(
                        (message) =>
                          message.id ===
                          currentOptimisticPair.assistantMessageId,
                      )?.agentRun
                    : undefined;
                let messages = session.messages;

                if (serverUserMessage || serverAssistantMessage) {
                  messages = removeMessages(
                    messages,
                    currentOptimisticPair &&
                      currentOptimisticPair.sessionId === sessionId
                      ? [
                          currentOptimisticPair.userMessageId,
                          currentOptimisticPair.assistantMessageId,
                        ]
                      : [],
                  );
                }
                messages = upsertMessage(messages, serverUserMessage);
                messages = upsertMessage(
                  messages,
                  serverAssistantMessage
                    ? {
                        ...serverAssistantMessage,
                        agentRun: optimisticAssistantRun,
                      }
                    : undefined,
                );
                if (completedMessage) {
                  const existingMessage = messages.find(
                    (message) => message.id === completedMessage.id,
                  );
                  messages = upsertMessage(messages, {
                    ...completedMessage,
                    agentRun:
                      completedMessage.agentRun || existingMessage?.agentRun,
                  });
                }

                messages = updateMessage(
                  messages,
                  targetMessageId,
                  (message) => {
                    const currentAgentRun = message.agentRun;
                    const toolCalls = event.tool_call
                      ? upsertToolCall(
                          currentAgentRun?.toolCalls || [],
                          event.tool_call,
                        )
                      : currentAgentRun?.toolCalls || [];
                    const evidences = event.evidence
                      ? upsertEvidence(
                          currentAgentRun?.evidences || [],
                          event.evidence,
                        )
                      : currentAgentRun?.evidences || [];
                    const status =
                      event.run?.status || currentAgentRun?.status || 'running';
                    const nextContent = getNextAgentMessageContent(
                      message,
                      event,
                      completedMessage,
                    );
                    const timeline = applyAgentStreamTimelineEvent(
                      currentAgentRun?.timeline || [],
                      event,
                      {
                        answerContent: nextContent,
                      },
                    );
                    const runFailed = event.event === 'agent.run.failed';

                    return {
                      ...message,
                      agentRun: mergeAgentRun(currentAgentRun, {
                        evidences,
                        errorMessage: getNextAgentRunErrorMessage(
                          currentAgentRun,
                          event,
                        ),
                        route: event.route,
                        run: event.run,
                        status: runFailed ? 'failed' : status,
                        timeline,
                        toolCalls,
                      }),
                      content: nextContent,
                      errorMessage: runFailed
                        ? event.error_message || event.run?.error_message
                        : message.errorMessage,
                      status:
                        event.event === 'agent.run.completed'
                          ? 'completed'
                          : runFailed
                            ? 'failed'
                            : 'streaming',
                    };
                  },
                );

                if (event.session) {
                  return toChatSession(event.session, messages);
                }
                return {
                  ...session,
                  messages,
                  updatedAt: Date.now(),
                };
              })()
            : session,
        ),
      }));
      if (serverUserMessage || serverAssistantMessage) {
        optimisticMessagesRef.current = undefined;
      }

      if (
        event.event === 'agent.run.completed' ||
        event.event === 'agent.run.failed'
      ) {
        streamingAgentRunIdRef.current = undefined;
        streamingMessageIdRef.current = undefined;
        streamingSessionIdRef.current = undefined;
      }
    },
    [],
  );

  const sendAgentMessage = useCallback(
    async (content: string) => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      submittingRef.current = true;
      setSubmitting(true);
      let runStarted = false;
      let optimisticPair: OptimisticMessagePair | undefined;
      let sessionId: string | undefined = activeSession?.id;
      const scope = toAgentScopePayload(agentScope);

      try {
        if (agentMode === 'auto') {
          const routeRes = await routeAgent(
            {
              message: content,
              scope,
            },
            { skipErrorHandler: true },
          );
          const route = routeRes.data;

          if (route?.need_confirm) {
            const confirmed = onConfirmAgentRoute
              ? await onConfirmAgentRoute(route)
              : false;
            if (!confirmed) {
              return;
            }
          }
        }

        if (!sessionId) {
          const session = await createSessionOnServer();
          sessionId = session?.id;
        }
        if (!sessionId) {
          return;
        }

        optimisticPair = appendOptimisticMessages(sessionId, content, {
          evidences: [],
          status: 'pending',
          timeline: [],
          toolCalls: [],
        });
        streamingMessageIdRef.current = optimisticPair.assistantMessageId;
        streamingSessionIdRef.current = sessionId;
        setDraft('');

        await readAgentRunStream({
          agentType: agentMode,
          body: {
            message: content,
            session_id: sessionId,
            scope,
            selected_agent: agentMode === 'auto' ? undefined : agentMode,
          },
          onEvent: (event) => {
            if (event.event === 'agent.run.created') {
              runStarted = true;
            }
            applyAgentStreamEvent(
              sessionId || '',
              optimisticPair?.assistantMessageId || '',
              event,
            );
          },
          signal: abortController.signal,
        });
      } catch (error) {
        if (isAbortError(error)) {
          if (!runStarted) {
            removeOptimisticMessages(optimisticPair);
            setDraft((currentDraft) => currentDraft || content);
          } else {
            failStreamingMessage(
              sessionId,
              streamingMessageIdRef.current ||
                optimisticPair?.assistantMessageId,
              '已停止诊断',
            );
          }
        } else {
          if (!runStarted) {
            removeOptimisticMessages(optimisticPair);
          }
          const errorMessage =
            error instanceof Error ? error.message : 'Agent 执行失败';
          antdMessage.error(errorMessage);
          if (runStarted) {
            failStreamingMessage(
              sessionId,
              streamingMessageIdRef.current ||
                optimisticPair?.assistantMessageId,
              errorMessage,
            );
          }
          setDraft((currentDraft) => currentDraft || content);
        }
      } finally {
        submittingRef.current = false;
        if (mountedRef.current) {
          setSubmitting(false);
        }
        if (!runStarted) {
          removeOptimisticMessages(optimisticPair);
          streamingAgentRunIdRef.current = undefined;
          streamingMessageIdRef.current = undefined;
          streamingSessionIdRef.current = undefined;
        }
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = undefined;
        }
      }
    },
    [
      activeSession?.id,
      agentMode,
      agentScope,
      appendOptimisticMessages,
      applyAgentStreamEvent,
      createSessionOnServer,
      failStreamingMessage,
      onConfirmAgentRoute,
      removeOptimisticMessages,
    ],
  );

  const sendMessage = useCallback(async () => {
    const content = draft.trim();
    if (!content || submittingRef.current) {
      return;
    }
    if (agentMode !== 'assistant') {
      await sendAgentMessage(content);
      return;
    }
    if (connectionStatus && connectionStatus !== 'connected') {
      antdMessage.warning('AI 大模型未连接，暂时无法发送消息');
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    submittingRef.current = true;
    setSubmitting(true);
    let streamMessageCreated = false;
    let optimisticPair: OptimisticMessagePair | undefined;
    let sessionId: string | undefined = activeSession?.id;

    try {
      if (!sessionId) {
        const session = await createSessionOnServer();
        sessionId = session?.id;
      }
      if (!sessionId) {
        return;
      }

      streamingSessionIdRef.current = sessionId;
      optimisticPair = appendOptimisticMessages(sessionId, content);
      setDraft('');
      await readAiChatStream({
        body: { content },
        onEvent: (event) => {
          if (event.event === 'message.created') {
            streamMessageCreated = true;
          }
          applyStreamEvent(sessionId || '', event);
        },
        sessionID: sessionId,
        signal: abortController.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        if (!streamMessageCreated) {
          removeOptimisticMessages(optimisticPair);
          setDraft((currentDraft) => currentDraft || content);
        }
      } else {
        if (!streamMessageCreated) {
          removeOptimisticMessages(optimisticPair);
        }
        onConnectionStatusChange?.('failed');
        const errorMessage =
          error instanceof Error ? error.message : '消息发送失败';
        antdMessage.error(errorMessage);
        if (streamMessageCreated) {
          failStreamingMessage(
            streamingSessionIdRef.current || sessionId,
            streamingMessageIdRef.current,
            errorMessage,
          );
        }
        setDraft((currentDraft) => currentDraft || content);
      }
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) {
        setSubmitting(false);
      }
      if (!streamMessageCreated) {
        removeOptimisticMessages(optimisticPair);
        streamingMessageIdRef.current = undefined;
        streamingSessionIdRef.current = undefined;
      }
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = undefined;
      }
    }
  }, [
    activeSession?.id,
    agentMode,
    appendOptimisticMessages,
    applyStreamEvent,
    connectionStatus,
    createSessionOnServer,
    draft,
    failStreamingMessage,
    onConnectionStatusChange,
    removeOptimisticMessages,
    sendAgentMessage,
  ]);

  const cancelMessage = useCallback(async () => {
    const agentRunId = streamingAgentRunIdRef.current;
    const messageId = streamingMessageIdRef.current;
    const sessionId = streamingSessionIdRef.current;
    abortControllerRef.current?.abort();
    if (!messageId || !sessionId) {
      return;
    }
    if (agentRunId) {
      failStreamingMessage(sessionId, messageId, '已停止诊断');
      try {
        await cancelAgentRun(agentRunId, {
          skipErrorHandler: true,
        });
      } catch (_error) {
        antdMessage.error('停止诊断失败');
      } finally {
        streamingAgentRunIdRef.current = undefined;
        streamingMessageIdRef.current = undefined;
        streamingSessionIdRef.current = undefined;
        submittingRef.current = false;
        if (mountedRef.current) {
          setSubmitting(false);
        }
      }
      return;
    }
    if (messageId.startsWith(LOCAL_MESSAGE_ID_PREFIX)) {
      failStreamingMessage(sessionId, messageId, '已停止诊断');
      streamingAgentRunIdRef.current = undefined;
      submittingRef.current = false;
      if (mountedRef.current) {
        setSubmitting(false);
      }
      return;
    }

    try {
      const res = await cancelAiChatMessage(messageId, {
        skipErrorHandler: true,
      });
      const canceledMessage = res.data ? toChatMessage(res.data) : undefined;
      if (!canceledMessage) {
        return;
      }

      setChatState((prevState) => ({
        ...prevState,
        sessions: prevState.sessions.map((session) => ({
          ...session,
          messages:
            session.id === sessionId
              ? upsertMessage(session.messages, canceledMessage)
              : session.messages,
        })),
      }));
    } catch (_error) {
      antdMessage.error('停止生成失败');
    } finally {
      streamingAgentRunIdRef.current = undefined;
      streamingMessageIdRef.current = undefined;
      streamingSessionIdRef.current = undefined;
      submittingRef.current = false;
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [failStreamingMessage]);

  const editMessage = useCallback((content: string) => {
    setDraft(content);
  }, []);

  const syncAgentFeedback = useCallback((feedback: API.AgentRunFeedback) => {
    setChatState((prevState) => {
      const sessions = applyAgentRunFeedback(
        prevState.sessions,
        feedback.run_id,
        feedback,
      );

      if (sessions === prevState.sessions) {
        return prevState;
      }

      return {
        ...prevState,
        sessions,
      };
    });
  }, []);

  const submitAgentFeedback = useCallback(
    async (runID: string, body: API.SubmitAgentRunFeedbackParams) => {
      const comment = body.comment?.trim();

      try {
        const res = await submitAgentRunFeedback(
          runID,
          {
            comment: comment || undefined,
            useful: body.useful,
          },
          { skipErrorHandler: true },
        );
        const feedback = res.data;

        if (!feedback) {
          if (mountedRef.current) {
            antdMessage.error('诊断反馈提交失败');
          }
          return false;
        }

        if (mountedRef.current) {
          setChatState((prevState) => {
            const sessions = applyAgentRunFeedback(
              prevState.sessions,
              runID,
              feedback,
            );

            if (sessions === prevState.sessions) {
              return prevState;
            }

            return {
              ...prevState,
              sessions,
            };
          });
          antdMessage.success('诊断反馈已提交');
        }

        return true;
      } catch (error) {
        if (mountedRef.current) {
          const apiError = error as APIError;
          const isConflict =
            apiError.info?.code === API_CONFLICT_CODE ||
            apiError.response?.data?.code === API_CONFLICT_CODE;
          antdMessage.error(
            isConflict
              ? '该消息已评价，无法重复评价'
              : getAPIErrorMessage(error, '诊断反馈提交失败'),
          );
        }
        return false;
      }
    },
    [],
  );

  return {
    activeSession,
    agentMode,
    agentScope,
    applyAgentRequest,
    cancelMessage,
    createSession,
    deleteSession,
    draft,
    editMessage,
    loading,
    selectSession,
    sendMessage,
    sessions: chatState.sessions,
    setAgentMode,
    setAgentScope,
    setDraft,
    submitAgentFeedback,
    syncAgentFeedback,
    submitting,
  };
};
