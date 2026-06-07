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
import type { ChatMessageItem, ChatMessageRole, ChatSession } from './types';
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

type StreamCompletion = {
  message: ChatMessageItem;
  session?: API.AiChatSessionItem;
};

type StreamTextBuffer = {
  chunks: string[];
  completed?: StreamCompletion;
  displayedContent: string;
  receivedContent: string;
  sessionId: string;
  timer?: ReturnType<typeof setTimeout>;
};

const LOCAL_MESSAGE_ID_PREFIX = 'local-message';
const STREAM_RENDER_INTERVAL_MS = 24;
const STREAM_RENDER_CHUNK_SIZE = 4;

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

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

const newLocalMessageId = (role: ChatMessageRole) =>
  `${LOCAL_MESSAGE_ID_PREFIX}-${role}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const splitStreamText = (content: string) => {
  if (!content) {
    return [];
  }

  const chars = Array.from(content);
  const chunks: string[] = [];
  for (let index = 0; index < chars.length; index += STREAM_RENDER_CHUNK_SIZE) {
    chunks.push(chars.slice(index, index + STREAM_RENDER_CHUNK_SIZE).join(''));
  }
  return chunks;
};

const nextStreamTextBatch = (chunks: string[]) => {
  const queuedLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const batchSize =
    queuedLength > 3000
      ? 72
      : queuedLength > 1200
        ? 40
        : queuedLength > 360
          ? 18
          : STREAM_RENDER_CHUNK_SIZE;

  let content = '';
  while (chunks.length > 0 && content.length < batchSize) {
    content += chunks.shift() || '';
  }
  return content;
};

const missingCompletionContent = (
  receivedContent: string,
  finalContent: string,
) => {
  if (!finalContent || finalContent === receivedContent) {
    return '';
  }
  if (!receivedContent) {
    return finalContent;
  }
  if (finalContent.startsWith(receivedContent)) {
    return finalContent.slice(receivedContent.length);
  }
  return '';
};

const missingBufferCompletionContent = (
  buffer: StreamTextBuffer,
  finalContent: string,
) => {
  if (!finalContent) {
    return '';
  }

  if (
    buffer.receivedContent &&
    (finalContent === buffer.receivedContent ||
      finalContent.startsWith(buffer.receivedContent))
  ) {
    return missingCompletionContent(buffer.receivedContent, finalContent);
  }

  return missingCompletionContent(buffer.displayedContent, finalContent);
};

const armStreamTextTimer = (
  messageId: string,
  buffer: StreamTextBuffer,
  flush: (messageId: string) => void,
  delay = 0,
) => {
  if (buffer.timer) {
    return;
  }

  buffer.timer = setTimeout(() => {
    buffer.timer = undefined;
    flush(messageId);
  }, delay);
};

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

type UseChatSessionsOptions = {
  connectionStatus?: API.AiConnectionStatus;
  onConnectionStatusChange?: (status: API.AiConnectionStatus) => void;
};

export const useChatSessions = ({
  connectionStatus,
  onConnectionStatusChange,
}: UseChatSessionsOptions = {}) => {
  const [chatState, setChatState] = useState<ChatWindowState>({
    sessions: [],
  });
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mountedRef = useRef(true);
  const creatingRef = useRef(false);
  const submittingRef = useRef(false);
  const detailRequestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const streamingMessageIdRef = useRef<string | undefined>(undefined);
  const streamingSessionIdRef = useRef<string | undefined>(undefined);
  const optimisticMessagesRef = useRef<OptimisticMessagePair | undefined>(
    undefined,
  );
  const streamTextBuffersRef = useRef(new Map<string, StreamTextBuffer>());

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
      streamTextBuffersRef.current.forEach((buffer) => {
        if (buffer.timer) {
          clearTimeout(buffer.timer);
        }
      });
      streamTextBuffersRef.current.clear();
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

  const clearStreamTextBuffer = useCallback((messageId?: string) => {
    if (!messageId) {
      return;
    }

    const buffer = streamTextBuffersRef.current.get(messageId);
    if (buffer?.timer) {
      clearTimeout(buffer.timer);
    }
    streamTextBuffersRef.current.delete(messageId);
  }, []);

  const clearSessionStreamBuffers = useCallback((sessionId?: string) => {
    if (!sessionId) {
      return;
    }

    streamTextBuffersRef.current.forEach((buffer, messageId) => {
      if (buffer.sessionId !== sessionId) {
        return;
      }
      if (buffer.timer) {
        clearTimeout(buffer.timer);
      }
      streamTextBuffersRef.current.delete(messageId);
    });
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      clearSessionStreamBuffers(sessionId);
      if (streamingSessionIdRef.current === sessionId) {
        abortControllerRef.current?.abort();
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
    [clearSessionStreamBuffers, createSessionOnServer, loadSessionDetail],
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
    (sessionId: string, content: string) => {
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

  const getStreamTextBuffer = useCallback(
    (sessionId: string, messageId: string) => {
      const existingBuffer = streamTextBuffersRef.current.get(messageId);
      if (existingBuffer) {
        existingBuffer.sessionId = sessionId;
        return existingBuffer;
      }

      const buffer: StreamTextBuffer = {
        chunks: [],
        displayedContent: '',
        receivedContent: '',
        sessionId,
      };
      streamTextBuffersRef.current.set(messageId, buffer);
      return buffer;
    },
    [],
  );

  const failStreamingMessage = useCallback(
    (sessionId?: string, messageId?: string, errorMessage?: string) => {
      if (!sessionId || !messageId) {
        return;
      }

      clearStreamTextBuffer(messageId);
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
                    errorMessage:
                      errorMessage || '消息生成中断，请重新发送消息',
                    status: 'failed',
                  }),
                ),
              }
            : session,
        ),
      }));

      if (streamingMessageIdRef.current === messageId) {
        streamingMessageIdRef.current = undefined;
        streamingSessionIdRef.current = undefined;
      }
    },
    [clearStreamTextBuffer],
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

  const flushStreamTextBuffer = useCallback(
    (messageId: string) => {
      if (!mountedRef.current) {
        return;
      }

      const buffer = streamTextBuffersRef.current.get(messageId);
      if (!buffer) {
        return;
      }

      const content = nextStreamTextBatch(buffer.chunks);
      if (content) {
        buffer.displayedContent += content;
        setChatState((prevState) => ({
          ...prevState,
          sessions: prevState.sessions.map((session) =>
            session.id === buffer.sessionId
              ? {
                  ...session,
                  messages: updateMessage(
                    session.messages,
                    messageId,
                    (message) => ({
                      ...message,
                      content: `${message.content}${content}`,
                      status: 'streaming',
                    }),
                  ),
                }
              : session,
          ),
        }));
      }

      if (buffer.chunks.length > 0) {
        armStreamTextTimer(
          messageId,
          buffer,
          flushStreamTextBuffer,
          STREAM_RENDER_INTERVAL_MS,
        );
        return;
      }

      if (buffer.completed) {
        const completed = buffer.completed;
        streamTextBuffersRef.current.delete(messageId);
        applyCompletedStreamMessage(
          buffer.sessionId,
          completed.message,
          completed.session,
        );
      }
    },
    [applyCompletedStreamMessage],
  );

  const enqueueStreamDelta = useCallback(
    (sessionId: string, messageId: string, delta?: string) => {
      if (!delta) {
        return;
      }

      const buffer = getStreamTextBuffer(sessionId, messageId);
      buffer.receivedContent += delta;
      buffer.chunks.push(...splitStreamText(delta));
      armStreamTextTimer(messageId, buffer, flushStreamTextBuffer);
    },
    [flushStreamTextBuffer, getStreamTextBuffer],
  );

  const completeStreamText = useCallback(
    (
      sessionId: string,
      completedMessage: ChatMessageItem,
      completedSession?: API.AiChatSessionItem,
    ) => {
      const buffer = getStreamTextBuffer(sessionId, completedMessage.id);
      const finalContent = completedMessage.content || '';
      const missingContent = missingBufferCompletionContent(
        buffer,
        finalContent,
      );

      if (missingContent) {
        buffer.receivedContent = finalContent;
        buffer.chunks.push(...splitStreamText(missingContent));
      }

      buffer.completed = {
        message: completedMessage,
        session: completedSession,
      };
      armStreamTextTimer(completedMessage.id, buffer, flushStreamTextBuffer);
    },
    [flushStreamTextBuffer, getStreamTextBuffer],
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
          clearStreamTextBuffer(assistantMessage.id);
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
        enqueueStreamDelta(sessionId, event.message_id, event.delta);
        return;
      }

      if (event.event === 'message.completed' && event.message) {
        const completedMessage = toChatMessage(event.message);
        streamingMessageIdRef.current = undefined;
        streamingSessionIdRef.current = undefined;
        completeStreamText(sessionId, completedMessage, event.session);
        return;
      }

      if (event.event === 'message.failed') {
        const failedMessage = event.message
          ? toChatMessage(event.message)
          : undefined;
        clearStreamTextBuffer(event.message_id || failedMessage?.id);
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
    [
      clearStreamTextBuffer,
      completeStreamText,
      enqueueStreamDelta,
      onConnectionStatusChange,
    ],
  );

  const sendMessage = useCallback(async () => {
    const content = draft.trim();
    if (!content || submittingRef.current) {
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
    appendOptimisticMessages,
    applyStreamEvent,
    connectionStatus,
    createSessionOnServer,
    draft,
    failStreamingMessage,
    onConnectionStatusChange,
    removeOptimisticMessages,
  ]);

  const cancelMessage = useCallback(async () => {
    const messageId = streamingMessageIdRef.current;
    const sessionId = streamingSessionIdRef.current;
    abortControllerRef.current?.abort();
    clearStreamTextBuffer(messageId);
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
      submittingRef.current = false;
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [clearStreamTextBuffer]);

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
