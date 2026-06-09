import { useMemo } from 'react';
import { ChatSidebar, ConversationPanel, PromptComposer } from './components';
import { useStyles } from './styles';
import { useAgentToolNames } from './useAgentToolNames';
import { useChatSessions } from './useChatSessions';

type ChatWindowProps = {
  connectionStatus?: API.AiConnectionStatus;
  onConnectionStatusChange?: (status: API.AiConnectionStatus) => void;
};

const ChatWindow = ({
  connectionStatus,
  onConnectionStatusChange,
}: ChatWindowProps) => {
  const { styles } = useStyles();
  const {
    activeSession,
    agentMode,
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
    setDraft,
    submitting,
  } = useChatSessions({ connectionStatus, onConnectionStatusChange });
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
            agentToolNameMap={agentToolNameMap}
            session={activeSession}
            onEditMessage={editMessage}
          />
        </div>
        <PromptComposer
          agentMode={agentMode}
          disabled={!activeSession || loading}
          sendDisabled={Boolean(
            agentMode === 'assistant' &&
              connectionStatus &&
              connectionStatus !== 'connected',
          )}
          submitting={submitting}
          value={draft}
          onAgentModeChange={setAgentMode}
          onChange={setDraft}
          onCancel={cancelMessage}
          onSubmit={sendMessage}
        />
      </main>
    </div>
  );
};

export default ChatWindow;
