import { message as antdMessage } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type AiChatStreamEvent,
  cancelAiChatMessage,
  createAiChatSession,
  deleteAiChatSession,
  getAiChatSessionDetail,
  getAiChatSessionList,
} from '@/services/kubeflare/ai/chat';
import type { ChatMessageItem, ChatSession } from './types';
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

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

const hasInFlightMessage = (messages: ChatMessageItem[]) =>
  messages.some(
    (message) => message.status === 'pending' || message.status === 'streaming',
  );

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

export const useChatSessions = () => {
  const [chatState, setChatState] = useState<ChatWindowState>({
    sessions: [],
  });
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mountedRef = useRef(true);
  const creatingRef = useRef(false);
  const detailRequestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const streamingMessageIdRef = useRef<string | undefined>(undefined);
  const streamingSessionIdRef = useRef<string | undefined>(undefined);

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

  const deleteSession = useCallback(
    async (sessionId: string) => {
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
          let messages = existingSession?.messages || [];
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
            activeSessionId: sessionId,
            sessions: upsertSessionToTop(prevState.sessions, updatedSession),
          };
        });
        return;
      }

      if (event.event === 'message.delta' && event.message_id) {
        setChatState((prevState) => ({
          ...prevState,
          sessions: prevState.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: updateMessage(
                    session.messages,
                    event.message_id || '',
                    (message) => ({
                      ...message,
                      content: `${message.content}${event.delta || ''}`,
                      status: 'streaming',
                    }),
                  ),
                }
              : session,
          ),
        }));
        return;
      }

      if (event.event === 'message.completed' && event.message) {
        const completedMessage = toChatMessage(event.message);
        streamingMessageIdRef.current = undefined;
        streamingSessionIdRef.current = undefined;
        setChatState((prevState) => {
          const existingSession = prevState.sessions.find(
            (session) => session.id === sessionId,
          );
          const messages = upsertMessage(
            existingSession?.messages || [],
            completedMessage,
          );
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
            activeSessionId: sessionId,
            sessions: upsertSessionToTop(prevState.sessions, updatedSession),
          };
        });
        return;
      }

      if (event.event === 'message.failed') {
        const failedMessage = event.message
          ? toChatMessage(event.message)
          : undefined;
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
    [],
  );

  const sendMessage = useCallback(async () => {
    const content = draft.trim();
    if (!content || submitting) {
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setSubmitting(true);
    let streamMessageCreated = false;

    try {
      let sessionId: string | undefined = activeSession?.id;
      if (!sessionId) {
        const session = await createSessionOnServer();
        sessionId = session?.id;
      }
      if (!sessionId) {
        return;
      }

      streamingSessionIdRef.current = sessionId;
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
          setDraft((currentDraft) => currentDraft || content);
        }
      } else {
        antdMessage.error(
          error instanceof Error ? error.message : '消息发送失败',
        );
        setDraft((currentDraft) => currentDraft || content);
      }
    } finally {
      if (mountedRef.current) {
        setSubmitting(false);
      }
      if (!streamMessageCreated) {
        streamingMessageIdRef.current = undefined;
        streamingSessionIdRef.current = undefined;
      }
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = undefined;
      }
    }
  }, [
    activeSession?.id,
    applyStreamEvent,
    createSessionOnServer,
    draft,
    submitting,
  ]);

  const cancelMessage = useCallback(async () => {
    const messageId = streamingMessageIdRef.current;
    const sessionId = streamingSessionIdRef.current;
    abortControllerRef.current?.abort();
    if (!messageId || !sessionId) {
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
      streamingMessageIdRef.current = undefined;
      streamingSessionIdRef.current = undefined;
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  }, []);

  const editMessage = useCallback((content: string) => {
    setDraft(content);
  }, []);

  return {
    activeSession,
    cancelMessage,
    createSession,
    deleteSession,
    draft,
    editMessage,
    loading,
    selectSession,
    sendMessage,
    sessions: chatState.sessions,
    setDraft,
    submitting,
  };
};
