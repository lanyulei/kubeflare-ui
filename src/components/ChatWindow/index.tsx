import { App } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AgentRunDetailDrawer from '@/pages/system/ai/components/AgentRunDetailDrawer';
import { getErrorMessage } from '@/pages/system/ai/utils';
import { getAgentRunDetail } from '@/services/kubeflare/agent';
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
  const { message, modal } = App.useApp();
  const { styles } = useStyles();
  const agentModeOptions = useAgentModeOptions();
  const mountedRef = useRef(true);
  const runDetailRequestRef = useRef(0);
  const [runDetailOpen, setRunDetailOpen] = useState(false);
  const [runDetailLoading, setRunDetailLoading] = useState(false);
  const [runDetail, setRunDetail] = useState<API.AgentRunDetail>();
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
    syncAgentFeedback,
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

  const openAgentRunDetail = useCallback(
    (runID: string) => {
      const requestId = runDetailRequestRef.current + 1;
      runDetailRequestRef.current = requestId;
      setRunDetailOpen(true);
      setRunDetailLoading(true);
      setRunDetail(undefined);

      void getAgentRunDetail(runID, { skipErrorHandler: true })
        .then((res) => {
          if (
            !mountedRef.current ||
            requestId !== runDetailRequestRef.current
          ) {
            return;
          }
          setRunDetail(res.data);
        })
        .catch((error) => {
          if (
            !mountedRef.current ||
            requestId !== runDetailRequestRef.current
          ) {
            return;
          }
          message.error(getErrorMessage(error, 'Run 详情加载失败'));
        })
        .finally(() => {
          if (
            !mountedRef.current ||
            requestId !== runDetailRequestRef.current
          ) {
            return;
          }
          setRunDetailLoading(false);
        });
    },
    [message],
  );

  const closeAgentRunDetail = useCallback(() => {
    runDetailRequestRef.current += 1;
    setRunDetailOpen(false);
    setRunDetailLoading(false);
  }, []);

  const handleRunDetailFeedbackSubmitted = useCallback(
    (feedback: API.AgentRunFeedback) => {
      setRunDetail((current) =>
        current?.run.id === feedback.run_id
          ? {
              ...current,
              feedback,
            }
          : current,
      );
      syncAgentFeedback(feedback);
    },
    [syncAgentFeedback],
  );

  useEffect(
    () => () => {
      mountedRef.current = false;
      runDetailRequestRef.current += 1;
    },
    [],
  );

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
            onOpenAgentRunDetail={openAgentRunDetail}
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
      <AgentRunDetailDrawer
        detail={runDetail}
        loading={runDetailLoading}
        open={runDetailOpen}
        onClose={closeAgentRunDetail}
        onFeedbackSubmitted={handleRunDetailFeedbackSubmitted}
      />
    </div>
  );
};

export default ChatWindow;
