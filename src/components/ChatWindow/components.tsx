import {
  BranchesOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileSearchOutlined,
  LoadingOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Empty, Input, Popconfirm, Select, Tag } from 'antd';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import MarkdownContent from '../MarkdownContent';
import { useStyles } from './styles';
import type {
  ChatAgentMode,
  ChatAgentRun,
  ChatMessageItem,
  ChatSession,
} from './types';

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
  agentMode: ChatAgentMode;
  agentScope: API.AgentScope;
  disabled?: boolean;
  sendDisabled?: boolean;
  submitting?: boolean;
  value: string;
  onAgentModeChange: (mode: ChatAgentMode) => void;
  onAgentScopeChange: (scope: API.AgentScope) => void;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const agentModeOptions: { label: string; value: ChatAgentMode }[] = [
  { label: '普通助手', value: 'assistant' },
  { label: '自动选择', value: 'auto' },
  { label: '诊断 Agent', value: 'diagnostic' },
];

const resourceKindOptions = [
  { label: 'Pod', value: 'pod' },
  { label: 'Node', value: 'node' },
  { label: 'Deployment', value: 'deployment' },
  { label: 'StatefulSet', value: 'statefulset' },
  { label: 'DaemonSet', value: 'daemonset' },
];

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
            <AgentRunPanel agentRun={message.agentRun} />
            <MarkdownContent content={assistantContent} />
          </article>
        )}
      </div>
    </div>
  );
};

const AgentRunPanel = ({ agentRun }: { agentRun?: ChatAgentRun }) => {
  const { styles } = useStyles();
  if (!agentRun) {
    return null;
  }

  const route = agentRun.route || agentRun.run;
  const status = agentRun.status || agentRun.run?.status || 'running';
  const confidence =
    agentRun.route?.confidence ?? agentRun.run?.confidence ?? undefined;
  const statusIcon =
    status === 'completed' ? (
      <CheckCircleOutlined />
    ) : status === 'failed' ? (
      <CloseCircleOutlined />
    ) : (
      <LoadingOutlined />
    );

  return (
    <div className={styles.agentRunPanel} data-chat-window="agent-run">
      <div className={styles.agentRunHeader}>
        <Tag icon={<BranchesOutlined />} color="processing">
          {route?.agent_type || 'diagnostic'}
        </Tag>
        <Tag icon={statusIcon} color={status === 'failed' ? 'error' : 'blue'}>
          {status}
        </Tag>
        {typeof confidence === 'number' ? (
          <span className={styles.agentConfidence}>
            {Math.round(confidence * 100)}%
          </span>
        ) : null}
      </div>
      {agentRun.route?.reason ? (
        <div className={styles.agentReason}>{agentRun.route.reason}</div>
      ) : null}
      {agentRun.toolCalls.length > 0 ? (
        <div className={styles.agentToolList}>
          {agentRun.toolCalls.map((toolCall) => (
            <Tag
              key={toolCall.id}
              color={
                toolCall.status === 'failed'
                  ? 'error'
                  : toolCall.status === 'completed'
                    ? 'success'
                    : 'processing'
              }
            >
              {toolCall.tool_id}
            </Tag>
          ))}
        </div>
      ) : null}
      {agentRun.evidences.length > 0 ? (
        <div className={styles.agentEvidenceList}>
          {agentRun.evidences.slice(0, 6).map((evidence) => (
            <div className={styles.agentEvidenceItem} key={evidence.id}>
              <FileSearchOutlined />
              <span>{evidence.summary}</span>
            </div>
          ))}
        </div>
      ) : null}
      {agentRun.errorMessage ? (
        <div className={styles.agentError}>{agentRun.errorMessage}</div>
      ) : null}
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
    lastMessage?.agentRun?.evidences.length,
    lastMessage?.agentRun?.status,
    lastMessage?.agentRun?.toolCalls.length,
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
  agentMode,
  agentScope,
  disabled,
  sendDisabled,
  submitting,
  value,
  onAgentModeChange,
  onAgentScopeChange,
  onChange,
  onCancel,
  onSubmit,
}: PromptComposerProps) => {
  const { styles } = useStyles();
  const canSubmit =
    Boolean(value.trim()) && !disabled && !sendDisabled && !submitting;

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
      <AgentControlBar
        agentMode={agentMode}
        agentScope={agentScope}
        disabled={disabled || submitting}
        onAgentModeChange={onAgentModeChange}
        onAgentScopeChange={onAgentScopeChange}
      />
      <div className={styles.composerRow}>
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
      </div>
    </form>
  );
};

const AgentControlBar = ({
  agentMode,
  agentScope,
  disabled,
  onAgentModeChange,
  onAgentScopeChange,
}: {
  agentMode: ChatAgentMode;
  agentScope: API.AgentScope;
  disabled?: boolean;
  onAgentModeChange: (mode: ChatAgentMode) => void;
  onAgentScopeChange: (scope: API.AgentScope) => void;
}) => {
  const { styles } = useStyles();
  const scopeDisabled = disabled || agentMode === 'assistant';

  return (
    <div className={styles.agentControlBar} data-chat-window="agent-control">
      <Select
        className={styles.agentModeSelect}
        disabled={disabled}
        options={agentModeOptions}
        size="small"
        value={agentMode}
        onChange={onAgentModeChange}
      />
      <Input
        className={styles.agentScopeInput}
        disabled={scopeDisabled}
        placeholder="namespace"
        size="small"
        value={agentScope.namespace || ''}
        onChange={(event) =>
          onAgentScopeChange({
            ...agentScope,
            namespace: event.target.value,
          })
        }
      />
      <Select
        allowClear
        className={styles.agentKindSelect}
        disabled={scopeDisabled}
        options={resourceKindOptions}
        placeholder="resource"
        size="small"
        value={agentScope.resource_kind || undefined}
        onChange={(value) =>
          onAgentScopeChange({
            ...agentScope,
            resource_kind: value,
          })
        }
      />
      <Input
        className={styles.agentScopeInput}
        disabled={scopeDisabled}
        placeholder="name"
        size="small"
        value={agentScope.resource_name || ''}
        onChange={(event) =>
          onAgentScopeChange({
            ...agentScope,
            resource_name: event.target.value,
          })
        }
      />
      <Input
        className={styles.agentScopeInput}
        disabled={scopeDisabled}
        placeholder="container"
        size="small"
        value={agentScope.container || ''}
        onChange={(event) =>
          onAgentScopeChange({
            ...agentScope,
            container: event.target.value,
          })
        }
      />
    </div>
  );
};
