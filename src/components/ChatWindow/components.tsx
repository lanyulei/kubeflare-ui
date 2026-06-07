import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Empty, Input, Popconfirm } from 'antd';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { useStyles } from './styles';
import type { ChatMessageItem, ChatSession } from './types';

const { TextArea } = Input;
const sessionTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
});

type ChatMessageProps = {
  message: ChatMessageItem;
  onEditMessage: (content: string) => void;
};

type ChatSidebarProps = {
  activeSessionId?: string;
  sessions: ChatSession[];
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onSelectSession: (sessionId: string) => void;
};

type ConversationPanelProps = {
  session?: ChatSession;
  onEditMessage: (content: string) => void;
};

type PromptComposerProps = {
  disabled?: boolean;
  submitting?: boolean;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const formatSessionTime = (timestamp: number) =>
  sessionTimeFormatter.format(timestamp);

const getSessionPreview = (session: ChatSession) => {
  const lastMessage = session.messages[session.messages.length - 1];
  const preview =
    lastMessage?.content.replace(/\s+/g, ' ').trim() ||
    session.summary?.replace(/\s+/g, ' ').trim() ||
    '暂无消息';
  return preview.length > 42 ? `${preview.slice(0, 42)}...` : preview;
};

const ChatMessage = ({ message, onEditMessage }: ChatMessageProps) => {
  const { styles, cx } = useStyles();
  const isUser = message.role === 'user';
  const avatar: ReactNode = isUser ? <UserOutlined /> : <RobotOutlined />;
  const assistantContent =
    message.status === 'failed'
      ? message.errorMessage || '消息生成失败，请重试'
      : message.content ||
        (message.status === 'pending' || message.status === 'streaming'
          ? '正在生成...'
          : '');

  return (
    <div
      className={cx(
        styles.chatMessage,
        isUser ? styles.chatMessageUser : styles.chatMessageAssistant,
      )}
      data-chat-window={`${message.role}-message`}
    >
      <Avatar
        className={cx(
          styles.messageAvatar,
          isUser ? styles.userMessageAvatar : styles.assistantAvatar,
        )}
        icon={avatar}
      />
      <div
        className={cx(
          styles.messageContent,
          isUser ? styles.userMessageContent : styles.assistantMessageContent,
        )}
      >
        {isUser ? (
          <div className={styles.userInputCard} data-chat-window="user-input">
            <span>{message.content}</span>
            <Button
              aria-label="编辑这条消息"
              className={styles.editButton}
              icon={<EditOutlined />}
              type="text"
              onClick={() => onEditMessage(message.content)}
            />
          </div>
        ) : (
          <article
            className={styles.responseCard}
            data-chat-window="response-card"
          >
            <MarkdownRenderer content={assistantContent} />
          </article>
        )}
      </div>
    </div>
  );
};

export const ChatSidebar = ({
  activeSessionId,
  sessions,
  onCreateSession,
  onDeleteSession,
  onSelectSession,
}: ChatSidebarProps) => {
  const { styles, cx } = useStyles();

  return (
    <aside className={styles.sidebar} data-chat-window="sidebar">
      <div className={styles.sidebarHeader}>
        <Button
          aria-label="新建会话"
          className={styles.newSessionButton}
          icon={<PlusOutlined />}
          type="primary"
          onClick={onCreateSession}
        >
          新建会话
        </Button>
      </div>
      <nav className={styles.sessionList} aria-label="聊天会话">
        {sessions.map((session) => (
          <div
            className={cx(
              styles.sessionItem,
              session.id === activeSessionId && styles.sessionItemActive,
            )}
            data-chat-window="session-item"
            key={session.id}
          >
            <button
              aria-pressed={session.id === activeSessionId}
              aria-label={`切换到会话 ${session.title}`}
              className={styles.sessionSelectButton}
              title={session.title}
              type="button"
              onClick={() => onSelectSession(session.id)}
            >
              <span className={styles.sessionContent}>
                <span className={styles.sessionHeaderRow}>
                  <span
                    className={styles.sessionTitle}
                    data-chat-window="session-title"
                  >
                    {session.title}
                  </span>
                  <span
                    className={styles.sessionTime}
                    data-chat-window="session-time"
                  >
                    {formatSessionTime(session.updatedAt)}
                  </span>
                </span>
                <span className={styles.sessionFooterRow}>
                  <span
                    className={styles.sessionPreview}
                    data-chat-window="session-preview"
                  >
                    {getSessionPreview(session)}
                  </span>
                </span>
              </span>
            </button>
            <Popconfirm
              title="确认删除该会话吗？"
              description="删除后该会话中的消息记录将无法恢复。"
              okButtonProps={{ danger: true }}
              okText="删除"
              cancelText="取消"
              onConfirm={() => onDeleteSession(session.id)}
            >
              <Button
                aria-label={`删除会话 ${session.title}`}
                className={styles.sessionDeleteButton}
                data-chat-window="session-delete"
                icon={<DeleteOutlined />}
                type="text"
              />
            </Popconfirm>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export const ConversationPanel = ({
  session,
  onEditMessage,
}: ConversationPanelProps) => {
  const { styles } = useStyles();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessage = session?.messages[session.messages.length - 1];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [
    lastMessage?.content.length,
    lastMessage?.status,
    session?.id,
    session?.messages.length,
  ]);

  if (!session || session.messages.length === 0) {
    return (
      <section className={styles.conversation}>
        <div className={styles.emptyState} data-chat-window="empty-state">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="新会话已准备好"
          />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.conversation}>
      <div className={styles.messageStack}>
        {session.messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onEditMessage={onEditMessage}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </section>
  );
};

export const PromptComposer = ({
  disabled,
  submitting,
  value,
  onChange,
  onCancel,
  onSubmit,
}: PromptComposerProps) => {
  const { styles } = useStyles();
  const canSubmit = Boolean(value.trim()) && !disabled && !submitting;

  const handleSubmit = () => {
    if (submitting) {
      onCancel();
      return;
    }
    if (canSubmit) {
      onSubmit();
    }
  };

  const handlePressEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      className={styles.composer}
      data-chat-window="composer"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <TextArea
        autoSize={{ maxRows: 4, minRows: 1 }}
        className={styles.promptInput}
        disabled={disabled || submitting}
        placeholder="输入消息"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onPressEnter={handlePressEnter}
      />
      <Button
        className={styles.submitButton}
        disabled={submitting ? false : !canSubmit}
        htmlType="submit"
        icon={submitting ? <StopOutlined /> : <SendOutlined />}
        type="primary"
      >
        {submitting ? '停止' : '发送'}
      </Button>
    </form>
  );
};
