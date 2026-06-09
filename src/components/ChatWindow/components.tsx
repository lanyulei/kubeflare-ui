import {
  BranchesOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  FileSearchOutlined,
  LoadingOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  StopOutlined,
  UpOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Empty,
  Input,
  Popconfirm,
  Select,
  Tag,
  Tooltip,
} from 'antd';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import MarkdownContent from '../MarkdownContent';
import { useStyles } from './styles';
import type {
  ChatAgentMode,
  ChatAgentRun,
  ChatMessageItem,
  ChatSession,
} from './types';
import type { AgentToolNameMap } from './useAgentToolNames';
import { getAgentToolDisplayName } from './useAgentToolNames';

const { TextArea } = Input;
const sessionTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
});

type ChatMessageProps = {
  agentToolNameMap: AgentToolNameMap;
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
  agentToolNameMap: AgentToolNameMap;
  session?: ChatSession;
  onEditMessage: (content: string) => void;
};

type PromptComposerProps = {
  agentMode: ChatAgentMode;
  disabled?: boolean;
  sendDisabled?: boolean;
  submitting?: boolean;
  value: string;
  onAgentModeChange: (mode: ChatAgentMode) => void;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const agentModeOptions: { label: string; value: ChatAgentMode }[] = [
  { label: '自动选择', value: 'auto' },
  { label: '普通助手', value: 'assistant' },
  { label: '诊断 Agent', value: 'diagnostic' },
];

const getAgentModeLabel = (agentType?: string) =>
  agentModeOptions.find((option) => option.value === agentType)?.label ||
  agentType ||
  '诊断 Agent';

const agentRunStatusText: Record<API.AgentRunStatus, string> = {
  cancelled: '已取消',
  completed: '已完成',
  failed: '失败',
  pending: '等待中',
  running: '运行中',
};

const getAgentRunStatusText = (status: API.AgentRunStatus) =>
  agentRunStatusText[status] || status;

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

const ChatMessage = ({
  agentToolNameMap,
  message,
  onEditMessage,
}: ChatMessageProps) => {
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
            <AgentRunPanel
              agentRun={message.agentRun}
              toolNameMap={agentToolNameMap}
            />
            <MarkdownContent content={assistantContent} />
          </article>
        )}
      </div>
    </div>
  );
};

const AgentRunPanel = ({
  agentRun,
  toolNameMap,
}: {
  agentRun?: ChatAgentRun;
  toolNameMap: AgentToolNameMap;
}) => {
  const { styles, cx } = useStyles();
  const [evidenceListExpanded, setEvidenceListExpanded] = useState(false);
  const [toolListExpanded, setToolListExpanded] = useState(false);
  if (!agentRun) {
    return null;
  }

  const route = agentRun.route || agentRun.run;
  if (route?.agent_type === 'assistant') {
    return null;
  }

  const status = agentRun.status || agentRun.run?.status || 'running';
  const evidenceListFoldable = status === 'completed' || status === 'failed';
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
          {getAgentModeLabel(route?.agent_type)}
        </Tag>
        <Tag icon={statusIcon} color={status === 'failed' ? 'error' : 'blue'}>
          {getAgentRunStatusText(status)}
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
        <div className={styles.agentToolSummary}>
          <div
            className={cx(
              styles.agentToolList,
              !toolListExpanded && styles.agentToolListCollapsed,
            )}
          >
            {agentRun.toolCalls.map((toolCall) => {
              const toolID = toolCall.tool_id?.trim();
              const toolName = getAgentToolDisplayName(toolID, toolNameMap);
              const tooltipTitle =
                toolID && toolName !== toolID
                  ? `${toolName} (${toolID})`
                  : toolName;

              return (
                <Tooltip key={toolCall.id} title={tooltipTitle}>
                  <Tag
                    color={
                      toolCall.status === 'failed'
                        ? 'error'
                        : toolCall.status === 'completed'
                          ? 'success'
                          : 'processing'
                    }
                  >
                    {toolName}
                  </Tag>
                </Tooltip>
              );
            })}
          </div>
          <Button
            aria-label={toolListExpanded ? '收起工具列表' : '展开工具列表'}
            className={styles.agentToolToggle}
            icon={toolListExpanded ? <UpOutlined /> : <DownOutlined />}
            size="small"
            type="text"
            onClick={() => setToolListExpanded((expanded) => !expanded)}
          />
        </div>
      ) : null}
      {agentRun.evidences.length > 0 ? (
        <div
          className={cx(
            styles.agentEvidenceSummary,
            !evidenceListFoldable && styles.agentEvidenceSummaryOpen,
          )}
        >
          <div
            className={cx(
              styles.agentEvidenceList,
              evidenceListFoldable &&
                !evidenceListExpanded &&
                styles.agentEvidenceListCollapsed,
            )}
          >
            {agentRun.evidences.slice(0, 6).map((evidence) => (
              <div className={styles.agentEvidenceItem} key={evidence.id}>
                <FileSearchOutlined />
                <span>{evidence.summary}</span>
              </div>
            ))}
          </div>
          {evidenceListFoldable ? (
            <Button
              aria-label={
                evidenceListExpanded ? '收起证据列表' : '展开证据列表'
              }
              className={styles.agentToolToggle}
              icon={evidenceListExpanded ? <UpOutlined /> : <DownOutlined />}
              size="small"
              type="text"
              onClick={() => setEvidenceListExpanded((expanded) => !expanded)}
            />
          ) : null}
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
  agentToolNameMap,
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
            agentToolNameMap={agentToolNameMap}
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
  disabled,
  sendDisabled,
  submitting,
  value,
  onAgentModeChange,
  onChange,
  onCancel,
  onSubmit,
}: PromptComposerProps) => {
  const { styles } = useStyles();
  const composingRef = useRef(false);
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
    if (
      composingRef.current ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229
    ) {
      return;
    }
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
      <div className={styles.composerRow}>
        <div className={styles.promptInputShell}>
          <AgentModePrefix
            agentMode={agentMode}
            disabled={disabled || submitting}
            onAgentModeChange={onAgentModeChange}
          />
          <TextArea
            autoSize={{ maxRows: 4, minRows: 1 }}
            className={styles.promptInput}
            disabled={disabled || submitting}
            placeholder="输入消息"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onCompositionEnd={() => {
              composingRef.current = false;
            }}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onPressEnter={handlePressEnter}
          />
        </div>
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

const AgentModePrefix = ({
  agentMode,
  disabled,
  onAgentModeChange,
}: {
  agentMode: ChatAgentMode;
  disabled?: boolean;
  onAgentModeChange: (mode: ChatAgentMode) => void;
}) => {
  const { styles } = useStyles();

  return (
    <div className={styles.agentModePrefix} data-chat-window="agent-control">
      <Select
        className={styles.agentModeSelect}
        disabled={disabled}
        options={agentModeOptions}
        size="small"
        value={agentMode}
        variant="borderless"
        onChange={onAgentModeChange}
      />
    </div>
  );
};
