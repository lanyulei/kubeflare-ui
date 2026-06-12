import { App } from 'antd';
import { useCallback, useEffect, useMemo } from 'react';
import type { AgentDiagnoseRequest } from '../AgentDiagnoseButton';
import { ChatSidebar, ConversationPanel, PromptComposer } from './components';
import { useStyles } from './styles';
import { useAgentModeOptions } from './useAgentModeOptions';
import { useAgentToolNames } from './useAgentToolNames';
import { useChatSessions } from './useChatSessions';

type ChatWindowProps = {
  agentRequest?: AgentDiagnoseRequest;
  connectionStatus?: API.AiConnectionStatus;
  onAgentRequestConsumed?: () => void;
  onConnectionStatusChange?: (status: API.AiConnectionStatus) => void;
};

const ChatWindow = ({
  agentRequest,
  connectionStatus,
  onAgentRequestConsumed,
  onConnectionStatusChange,
}: ChatWindowProps) => {
  const { modal } = App.useApp();
  const { styles } = useStyles();
  const agentModeOptions = useAgentModeOptions();
  const confirmAgentRoute = useCallback(
    (route: API.AgentRouteResult) =>
      new Promise<boolean>((resolve) => {
        let settled = false;
        const finish = (confirmed: boolean) => {
          if (settled) {
            return;
          }
          settled = true;
          resolve(confirmed);
        };

        modal.confirm({
          title: '确认使用 Agent 诊断',
          content: route.skill_id
            ? `${route.reason}；命中技能：${route.skill_id}`
            : route.reason,
          okText: '继续诊断',
          cancelText: '取消',
          onCancel: () => finish(false),
          onOk: () => finish(true),
        });
      }),
    [modal],
  );
  const {
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
    sessions,
    setAgentMode,
    setAgentScope,
    setDraft,
    submitAgentFeedback,
    submitting,
  } = useChatSessions({
    connectionStatus,
    onConfirmAgentRoute: confirmAgentRoute,
    onConnectionStatusChange,
  });
  const hasAgentToolCalls = useMemo(
    () =>
      Boolean(
        activeSession?.messages.some(
          (message) => (message.agentRun?.toolCalls.length || 0) > 0,
        ),
      ),
    [activeSession],
  );
  const agentToolNameMap = useAgentToolNames(hasAgentToolCalls);

  useEffect(() => {
    if (!agentRequest) {
      return;
    }
    applyAgentRequest(agentRequest);
    onAgentRequestConsumed?.();
  }, [agentRequest, applyAgentRequest, onAgentRequestConsumed]);

  return (
    <div className={styles.shell} data-chat-window="shell">
      <ChatSidebar
        activeSessionId={activeSession?.id}
        sessions={sessions}
        onCreateSession={createSession}
        onDeleteSession={deleteSession}
        onSelectSession={selectSession}
      />
      <main className={styles.main}>
        <div className={styles.content}>
          <ConversationPanel
            agentModeOptions={agentModeOptions}
            agentToolNameMap={agentToolNameMap}
            session={activeSession}
            onEditMessage={editMessage}
            onSubmitAgentFeedback={submitAgentFeedback}
          />
        </div>
        <PromptComposer
          agentMode={agentMode}
          agentModeOptions={agentModeOptions}
          agentScope={agentScope}
          disabled={!activeSession || loading}
          sendDisabled={Boolean(
            agentMode === 'assistant' &&
              connectionStatus &&
              connectionStatus !== 'connected',
          )}
          submitting={submitting}
          value={draft}
          onAgentModeChange={setAgentMode}
          onAgentScopeChange={setAgentScope}
          onChange={setDraft}
          onCancel={cancelMessage}
          onSubmit={sendMessage}
        />
      </main>
    </div>
  );
};

export default ChatWindow;
