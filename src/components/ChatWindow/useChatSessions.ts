import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAssistantMessage,
  createBlankSession,
  createSessionTitle,
  createUserMessage,
  initialChatSessions,
} from './data';
import type { ChatMessageItem, ChatSession } from './types';

const CHAT_STORAGE_KEY = 'kubeflare.chatWindow.state';

type ChatWindowState = {
  activeSessionId?: string;
  sessions: ChatSession[];
};

const getChatStorage = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch (_error) {
    return undefined;
  }
};

const removeStoredChatState = (storage: Storage) => {
  try {
    storage.removeItem(CHAT_STORAGE_KEY);
  } catch (_error) {
    // Ignore storage cleanup failures and keep the in-memory fallback.
  }
};

const isChatMessage = (value: unknown): value is ChatMessageItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as ChatMessageItem;
  return (
    typeof message.id === 'string' &&
    typeof message.content === 'string' &&
    typeof message.createdAt === 'number' &&
    (message.role === 'assistant' || message.role === 'user')
  );
};

const isChatSession = (value: unknown): value is ChatSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as ChatSession;
  return (
    typeof session.id === 'string' &&
    typeof session.title === 'string' &&
    typeof session.createdAt === 'number' &&
    typeof session.updatedAt === 'number' &&
    Array.isArray(session.messages) &&
    session.messages.every(isChatMessage)
  );
};

const getInitialState = (): ChatWindowState => {
  const storage = getChatStorage();

  if (!storage) {
    return {
      activeSessionId: initialChatSessions[0]?.id,
      sessions: initialChatSessions,
    };
  }

  try {
    const storedValue = storage.getItem(CHAT_STORAGE_KEY);
    const parsedValue = storedValue
      ? (JSON.parse(storedValue) as ChatWindowState)
      : undefined;
    const sessions = parsedValue?.sessions?.filter(isChatSession) || [];
    const activeSessionId = sessions.some(
      (session) => session.id === parsedValue?.activeSessionId,
    )
      ? parsedValue?.activeSessionId
      : sessions[0]?.id;

    if (sessions.length > 0) {
      return {
        activeSessionId,
        sessions,
      };
    }
  } catch (_error) {
    removeStoredChatState(storage);
  }

  return {
    activeSessionId: initialChatSessions[0]?.id,
    sessions: initialChatSessions,
  };
};

const upsertSessionToTop = (
  sessions: ChatSession[],
  updatedSession: ChatSession,
) => [
  updatedSession,
  ...sessions.filter((session) => session.id !== updatedSession.id),
];

const findLastMessageIndex = (
  messages: ChatMessageItem[],
  predicate: (message: ChatMessageItem) => boolean,
) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (predicate(messages[index])) {
      return index;
    }
  }

  return -1;
};

export const useChatSessions = () => {
  const [chatState, setChatState] = useState<ChatWindowState>(getInitialState);
  const [draft, setDraft] = useState('');
  const activeSession = useMemo(
    () =>
      chatState.sessions.find(
        (session) => session.id === chatState.activeSessionId,
      ) || chatState.sessions[0],
    [chatState.activeSessionId, chatState.sessions],
  );

  useEffect(() => {
    const storage = getChatStorage();

    if (!storage) {
      return;
    }

    try {
      storage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({
          activeSessionId: activeSession?.id,
          sessions: chatState.sessions,
        }),
      );
    } catch (_error) {
      removeStoredChatState(storage);
    }
  }, [activeSession?.id, chatState.sessions]);

  const selectSession = useCallback((sessionId: string) => {
    setChatState((prevState) => {
      if (!prevState.sessions.some((session) => session.id === sessionId)) {
        return prevState;
      }

      return {
        ...prevState,
        activeSessionId: sessionId,
      };
    });
  }, []);

  const createSession = useCallback(() => {
    setChatState((prevState) => {
      const session = createBlankSession(prevState.sessions.length + 1);
      return {
        activeSessionId: session.id,
        sessions: [session, ...prevState.sessions],
      };
    });
    setDraft('');
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setChatState((prevState) => {
      const sessions = prevState.sessions.filter(
        (session) => session.id !== sessionId,
      );

      if (sessions.length === 0) {
        const session = createBlankSession(1);
        return {
          activeSessionId: session.id,
          sessions: [session],
        };
      }

      const activeSessionId =
        prevState.activeSessionId === sessionId ||
        !sessions.some((session) => session.id === prevState.activeSessionId)
          ? sessions[0].id
          : prevState.activeSessionId;

      return {
        activeSessionId,
        sessions,
      };
    });
  }, []);

  const sendMessage = useCallback(() => {
    const content = draft.trim();
    if (!content) {
      return;
    }

    const createdAt = Date.now();
    const userMessage = createUserMessage(content, createdAt);
    const assistantMessage = createAssistantMessage(content, createdAt + 1);

    setChatState((prevState) => {
      const fallbackSession =
        prevState.sessions[0] ||
        createBlankSession(prevState.sessions.length + 1, createdAt);
      const activeSessionId = prevState.sessions.some(
        (session) => session.id === prevState.activeSessionId,
      )
        ? prevState.activeSessionId
        : fallbackSession.id;
      const sessions = prevState.sessions.length
        ? prevState.sessions
        : [fallbackSession];
      const nextSessions = sessions.map((session) => {
        if (session.id !== activeSessionId) {
          return session;
        }

        const shouldUpdateTitle =
          session.messages.length === 0 || session.title.startsWith('新会话');

        return {
          ...session,
          messages: [...session.messages, userMessage, assistantMessage],
          title: shouldUpdateTitle
            ? createSessionTitle(content)
            : session.title,
          updatedAt: createdAt + 1,
        };
      });
      const updatedSession = nextSessions.find(
        (session) => session.id === activeSessionId,
      );

      return {
        activeSessionId,
        sessions: updatedSession
          ? upsertSessionToTop(nextSessions, updatedSession)
          : nextSessions,
      };
    });
    setDraft('');
  }, [draft]);

  const editMessage = useCallback((content: string) => {
    setDraft(content);
  }, []);

  const regenerateResponse = useCallback(() => {
    if (!activeSession) {
      return;
    }

    setChatState((prevState) => {
      const session = prevState.sessions.find(
        (item) => item.id === prevState.activeSessionId,
      );
      if (!session) {
        return prevState;
      }

      const lastUserIndex = findLastMessageIndex(
        session.messages,
        (message) => message.role === 'user',
      );
      if (lastUserIndex < 0) {
        return prevState;
      }

      const now = Date.now();
      const lastUserMessage = session.messages[lastUserIndex];
      const lastAssistantIndex = findLastMessageIndex(
        session.messages,
        (message) => message.role === 'assistant',
      );
      const assistantMessage = createAssistantMessage(
        lastUserMessage.content,
        now,
        true,
      );
      const messages =
        lastAssistantIndex > lastUserIndex
          ? session.messages.map((message, index) =>
              index === lastAssistantIndex ? assistantMessage : message,
            )
          : [...session.messages, assistantMessage];
      const updatedSession = {
        ...session,
        messages,
        updatedAt: now,
      };

      return {
        activeSessionId: updatedSession.id,
        sessions: upsertSessionToTop(prevState.sessions, updatedSession),
      };
    });
  }, [activeSession]);

  return {
    activeSession,
    createSession,
    deleteSession,
    draft,
    editMessage,
    regenerateResponse,
    selectSession,
    sendMessage,
    sessions: chatState.sessions,
    setDraft,
  };
};
