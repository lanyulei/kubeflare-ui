import { message as antdMessage } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createAiChatMessage,
  createAiChatSession,
  deleteAiChatSession,
  getAiChatSessionDetail,
  getAiChatSessionList,
} from '@/services/kubeflare/ai/chat';
import type { ChatMessageItem, ChatMessageRole, ChatSession } from './types';

type ChatWindowState = {
  activeSessionId?: string;
  sessions: ChatSession[];
};

const toTimestamp = (value?: string) => {
  if (!value) {
    return Date.now();
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Date.now();
};

const toChatRole = (role?: API.AiChatMessageRole): ChatMessageRole => {
  if (role === 'user' || role === 'system') {
    return role;
  }
  return 'assistant';
};

const toChatMessage = (message: API.AiChatMessageItem): ChatMessageItem => ({
  content: message.content || '',
  createdAt: toTimestamp(message.created_at),
  id: message.id,
  role: toChatRole(message.role),
});

const toChatSession = (
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

const toChatSessionDetail = (detail: API.AiChatSessionDetail): ChatSession =>
  toChatSession(detail, (detail.messages || []).map(toChatMessage));

const replaceSession = (
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

const upsertSessionToTop = (
  sessions: ChatSession[],
  updatedSession: ChatSession,
) => [
  updatedSession,
  ...sessions.filter((session) => session.id !== updatedSession.id),
];

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

      setChatState((prevState) => ({
        activeSessionId: prevState.activeSessionId || detail.id,
        sessions: replaceSession(prevState.sessions, detail),
      }));
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

  const sendMessage = useCallback(async () => {
    const content = draft.trim();
    if (!content || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      let sessionId: string | undefined = activeSession?.id;
      if (!sessionId) {
        const session = await createSessionOnServer();
        sessionId = session?.id;
      }
      if (!sessionId) {
        return;
      }

      const res = await createAiChatMessage(
        sessionId,
        { content },
        {
          skipErrorHandler: true,
        },
      );
      const detail = res.data ? toChatSessionDetail(res.data) : undefined;
      if (!detail || !mountedRef.current) {
        return;
      }

      setChatState((prevState) => ({
        activeSessionId:
          prevState.activeSessionId === sessionId || !prevState.activeSessionId
            ? detail.id
            : prevState.activeSessionId,
        sessions: upsertSessionToTop(prevState.sessions, detail),
      }));
      setDraft('');
    } catch (_error) {
      antdMessage.error('消息发送失败');
    } finally {
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [activeSession?.id, createSessionOnServer, draft, submitting]);

  const editMessage = useCallback((content: string) => {
    setDraft(content);
  }, []);

  return {
    activeSession,
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
