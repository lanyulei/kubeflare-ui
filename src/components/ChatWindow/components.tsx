import {
  BranchesOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClusterOutlined,
  DeleteOutlined,
  DislikeFilled,
  DislikeOutlined,
  DownOutlined,
  EditOutlined,
  FileSearchOutlined,
  LikeFilled,
  LikeOutlined,
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
  Modal,
  Popconfirm,
  Popover,
  Select,
  Tag,
  Tooltip,
} from 'antd';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  getAgentRouteSourceLabel,
  getAgentScopeSummary,
  getAgentTypeLabel,
  hasAgentScope,
  normalizeAgentScope,
} from '@/utils/agent';
import MarkdownContent from '../MarkdownContent';
import { useStyles } from './styles';
import type {
  ChatAgentMode,
  ChatAgentRun,
  ChatMessageItem,
  ChatSession,
} from './types';
import type { AgentModeOption } from './useAgentModeOptions';
import type { AgentToolNameMap } from './useAgentToolNames';
import { getAgentToolDisplayName } from './useAgentToolNames';

const { TextArea } = Input;
const sessionTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
});

type SubmitAgentFeedback = (
  runID: string,
  body: API.SubmitAgentRunFeedbackParams,
) => Promise<boolean>;

type ChatMessageProps = {
  agentModeOptions: AgentModeOption[];
  agentToolNameMap: AgentToolNameMap;
  message: ChatMessageItem;
  onEditMessage: (content: string) => void;
  onSubmitAgentFeedback: SubmitAgentFeedback;
};

type ChatSidebarProps = {
  activeSessionId?: string;
  sessions: ChatSession[];
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onSelectSession: (sessionId: string) => void;
};

type ConversationPanelProps = {
  agentModeOptions: AgentModeOption[];
  agentToolNameMap: AgentToolNameMap;
  session?: ChatSession;
  onEditMessage: (content: string) => void;
  onSubmitAgentFeedback: SubmitAgentFeedback;
};

type PromptComposerProps = {
  agentMode: ChatAgentMode;
  agentModeOptions: AgentModeOption[];
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

const getAgentModeLabel = (
  agentType?: string,
  agentModeOptions: AgentModeOption[] = [],
) =>
  agentModeOptions.find((option) => option.value === agentType)?.label ||
  getAgentTypeLabel(agentType);

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

const formatDateTime = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? sessionTimeFormatter.format(timestamp)
    : undefined;
};

const getLeaseOwnerDisplayText = (leaseOwner?: string) => {
  const trimmedOwner = leaseOwner?.trim();
  if (!trimmedOwner) {
    return undefined;
  }

  if (trimmedOwner.toLowerCase().startsWith('agent-instance-')) {
    return '当前实例';
  }

  return trimmedOwner.length > 18
    ? `运行实例 ${trimmedOwner.slice(0, 8)}...${trimmedOwner.slice(-4)}`
    : trimmedOwner;
};

const getSessionPreview = (session: ChatSession) => {
  const lastMessage = session.messages[session.messages.length - 1];
  const preview =
    lastMessage?.content.replace(/\s+/g, ' ').trim() ||
    session.summary?.replace(/\s+/g, ' ').trim() ||
    '暂无消息';
  return preview.length > 42 ? `${preview.slice(0, 42)}...` : preview;
};

const ChatMessage = ({
  agentModeOptions,
  agentToolNameMap,
  message,
  onEditMessage,
  onSubmitAgentFeedback,
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
              agentModeOptions={agentModeOptions}
              agentRun={message.agentRun}
              toolNameMap={agentToolNameMap}
              onSubmitAgentFeedback={onSubmitAgentFeedback}
            />
            <MarkdownContent content={assistantContent} />
          </article>
        )}
      </div>
    </div>
  );
};

const AgentRunPanel = ({
  agentModeOptions,
  agentRun,
  toolNameMap,
  onSubmitAgentFeedback,
}: {
  agentModeOptions: AgentModeOption[];
  agentRun?: ChatAgentRun;
  onSubmitAgentFeedback: SubmitAgentFeedback;
  toolNameMap: AgentToolNameMap;
}) => {
  const { styles, cx } = useStyles();
  const runID = agentRun?.run?.id;
  const [evidenceListExpanded, setEvidenceListExpanded] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [toolListExpanded, setToolListExpanded] = useState(false);
  const feedbackMountedRef = useRef(true);
  const feedbackSubmittingRef = useRef(false);

  useEffect(() => {
    setFeedbackComment('');
    setFeedbackOpen(false);
    setFeedbackSubmitting(false);
    feedbackSubmittingRef.current = false;
  }, [runID]);

  useEffect(() => {
    feedbackMountedRef.current = true;

    return () => {
      feedbackMountedRef.current = false;
    };
  }, []);

  if (!agentRun) {
    return null;
  }

  const route = agentRun.route || agentRun.run;
  if (route?.agent_type === 'assistant') {
    return null;
  }

  const status = agentRun.status || agentRun.run?.status || 'running';
  const evidenceListFoldable = status === 'completed' || status === 'failed';
  const feedbackUseful = agentRun.feedback?.useful;
  const hasSubmittedFeedback = typeof feedbackUseful === 'boolean';
  const feedbackCommentText = agentRun.feedback?.comment?.trim();
  const canSubmitFeedback = Boolean(
    runID &&
      !hasSubmittedFeedback &&
      (status === 'completed' || status === 'failed'),
  );
  const confidence =
    agentRun.route?.confidence ?? agentRun.run?.confidence ?? undefined;
  const routeSource = agentRun.route?.source || agentRun.run?.route_source;
  const skillID = agentRun.route?.skill_id;
  const heartbeatText = formatDateTime(agentRun.run?.heartbeat_at);
  const leaseOwner = agentRun.run?.lease_owner?.trim();
  const leaseOwnerText = getLeaseOwnerDisplayText(leaseOwner);
  const leaseExpiresText = formatDateTime(agentRun.run?.lease_expires);
  const statusIcon =
    status === 'completed' ? (
      <CheckCircleOutlined />
    ) : status === 'failed' ? (
      <CloseCircleOutlined />
    ) : (
      <LoadingOutlined />
    );

  const submitFeedback = async (useful: boolean, comment?: string) => {
    if (!runID || !canSubmitFeedback || feedbackSubmittingRef.current) {
      return;
    }

    feedbackSubmittingRef.current = true;
    setFeedbackSubmitting(true);
    try {
      const submitted = await onSubmitAgentFeedback(runID, {
        comment,
        useful,
      });

      if (submitted) {
        if (feedbackMountedRef.current) {
          setFeedbackComment('');
          setFeedbackOpen(false);
        }
      }
    } finally {
      feedbackSubmittingRef.current = false;
      if (feedbackMountedRef.current) {
        setFeedbackSubmitting(false);
      }
    }
  };

  return (
    <div
      className={cx(
        styles.agentRunPanel,
        agentRun.feedback && styles.agentRunPanelWithFeedback,
      )}
      data-chat-window="agent-run"
    >
      {agentRun.feedback ? (
        <div className={styles.agentFeedbackReadonly}>
          {agentRun.feedback.useful ? (
            <span
              aria-label="已评价：有用"
              className={styles.agentFeedbackReadonlyIcon}
              role="img"
            >
              <LikeFilled />
            </span>
          ) : (
            <Tooltip title={feedbackCommentText || undefined}>
              <span
                aria-label="已评价：需改进"
                className={styles.agentFeedbackReadonlyIcon}
                role="img"
              >
                <DislikeFilled />
              </span>
            </Tooltip>
          )}
        </div>
      ) : null}
      <div className={styles.agentRunHeader}>
        <Tag icon={<BranchesOutlined />} color="processing">
          {getAgentModeLabel(route?.agent_type, agentModeOptions)}
        </Tag>
        <Tag icon={statusIcon} color={status === 'failed' ? 'error' : 'blue'}>
          {getAgentRunStatusText(status)}
        </Tag>
        {routeSource ? (
          <Tag color="geekblue">{getAgentRouteSourceLabel(routeSource)}</Tag>
        ) : null}
        {skillID ? <Tag color="purple">技能 {skillID}</Tag> : null}
        {typeof confidence === 'number' ? (
          <span className={styles.agentConfidence}>
            {Math.round(confidence * 100)}%
          </span>
        ) : null}
      </div>
      {agentRun.route?.reason ? (
        <div className={styles.agentReason}>{agentRun.route.reason}</div>
      ) : null}
      {heartbeatText || leaseOwnerText ? (
        <div className={styles.agentRouteMeta}>
          {heartbeatText ? <Tag>心跳 {heartbeatText}</Tag> : null}
          {leaseOwnerText ? (
            <Tooltip
              title={
                <>
                  {leaseOwner ? <div>租约持有者：{leaseOwner}</div> : null}
                  {leaseExpiresText ? (
                    <div>租约到期：{leaseExpiresText}</div>
                  ) : null}
                </>
              }
            >
              <Tag>执行器 {leaseOwnerText}</Tag>
            </Tooltip>
          ) : null}
        </div>
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
                toolCall.status === 'failed' && toolCall.error_message
                  ? `${toolName}：${toolCall.error_message}`
                  : toolID && toolName !== toolID
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
      {canSubmitFeedback ? (
        <div className={styles.agentFeedback}>
          <div className={styles.agentFeedbackText}>
            <span>这次诊断是否有帮助？</span>
          </div>
          <div className={styles.agentFeedbackActions}>
            <Button
              aria-label="标记这次诊断有用"
              className={styles.agentFeedbackButton}
              disabled={!canSubmitFeedback || feedbackSubmitting}
              icon={<LikeOutlined />}
              loading={feedbackSubmitting && !feedbackOpen}
              size="small"
              onClick={() => submitFeedback(true)}
            >
              有用
            </Button>
            <Button
              aria-label="标记这次诊断需要改进"
              className={styles.agentFeedbackButton}
              disabled={!canSubmitFeedback || feedbackSubmitting}
              icon={<DislikeOutlined />}
              size="small"
              onClick={() => {
                if (!canSubmitFeedback) {
                  return;
                }
                setFeedbackComment(agentRun.feedback?.comment || '');
                setFeedbackOpen(true);
              }}
            >
              需改进
            </Button>
          </div>
          <Modal
            title="诊断反馈"
            open={feedbackOpen}
            okText="提交反馈"
            cancelText="取消"
            confirmLoading={feedbackSubmitting}
            onCancel={() => {
              if (!feedbackSubmitting) {
                setFeedbackOpen(false);
              }
            }}
            onOk={() => submitFeedback(false, feedbackComment)}
          >
            <div className={styles.agentFeedbackModalBody}>
              <div className={styles.agentFeedbackInput}>
                <TextArea
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  maxLength={1024}
                  placeholder="例如：证据不足、判断不准确、修复建议不可执行"
                  showCount
                  value={feedbackComment}
                  onChange={(event) => setFeedbackComment(event.target.value)}
                />
              </div>
            </div>
          </Modal>
        </div>
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
  agentModeOptions,
  agentToolNameMap,
  session,
  onEditMessage,
  onSubmitAgentFeedback,
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
            agentModeOptions={agentModeOptions}
            agentToolNameMap={agentToolNameMap}
            key={message.id}
            message={message}
            onEditMessage={onEditMessage}
            onSubmitAgentFeedback={onSubmitAgentFeedback}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </section>
  );
};

export const PromptComposer = ({
  agentMode,
  agentModeOptions,
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
      {agentMode !== 'assistant' ? (
        <AgentScopeControl
          disabled={disabled || submitting}
          scope={agentScope}
          onChange={onAgentScopeChange}
        />
      ) : null}
      <div className={styles.composerRow}>
        <div className={styles.promptInputShell}>
          <AgentModePrefix
            agentMode={agentMode}
            agentModeOptions={agentModeOptions}
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
  agentModeOptions,
  disabled,
  onAgentModeChange,
}: {
  agentMode: ChatAgentMode;
  agentModeOptions: AgentModeOption[];
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

const AgentScopeControl = ({
  disabled,
  scope,
  onChange,
}: {
  disabled?: boolean;
  scope: API.AgentScope;
  onChange: (scope: API.AgentScope) => void;
}) => {
  const { styles } = useStyles();
  const [draftScope, setDraftScope] = useState<API.AgentScope>(
    normalizeAgentScope(scope),
  );
  const active = hasAgentScope(scope);

  useEffect(() => {
    setDraftScope(normalizeAgentScope(scope));
  }, [scope]);

  const updateDraftScope = (field: keyof API.AgentScope, value: string) => {
    setDraftScope((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const content = (
    <div className={styles.agentScopePopover}>
      <div className={styles.agentScopeField}>
        <span>命名空间</span>
        <Input
          allowClear
          aria-label="Agent 诊断命名空间"
          size="small"
          value={draftScope.namespace}
          onChange={(event) =>
            updateDraftScope('namespace', event.target.value)
          }
        />
      </div>
      <div className={styles.agentScopeField}>
        <span>资源类型</span>
        <Input
          allowClear
          aria-label="Agent 诊断资源类型"
          size="small"
          value={draftScope.resource_kind}
          onChange={(event) =>
            updateDraftScope('resource_kind', event.target.value)
          }
        />
      </div>
      <div className={styles.agentScopeField}>
        <span>资源名称</span>
        <Input
          allowClear
          aria-label="Agent 诊断资源名称"
          size="small"
          value={draftScope.resource_name}
          onChange={(event) =>
            updateDraftScope('resource_name', event.target.value)
          }
        />
      </div>
      <div className={styles.agentScopeField}>
        <span>容器</span>
        <Input
          allowClear
          aria-label="Agent 诊断容器"
          size="small"
          value={draftScope.container}
          onChange={(event) =>
            updateDraftScope('container', event.target.value)
          }
        />
      </div>
      <div className={styles.agentScopeActions}>
        <Button
          size="small"
          onClick={() => {
            setDraftScope({});
            onChange({});
          }}
        >
          清空
        </Button>
        <Button
          size="small"
          type="primary"
          onClick={() => onChange(normalizeAgentScope(draftScope))}
        >
          应用
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      placement="topLeft"
      trigger="click"
      overlayClassName={styles.agentScopeOverlay}
    >
      <Button
        className={styles.agentScopeButton}
        disabled={disabled}
        icon={<ClusterOutlined />}
        type={active ? 'primary' : 'default'}
      >
        {getAgentScopeSummary(scope)}
      </Button>
    </Popover>
  );
};
