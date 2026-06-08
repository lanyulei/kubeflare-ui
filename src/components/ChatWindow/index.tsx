import { ChatSidebar, ConversationPanel, PromptComposer } from './components';
import { useStyles } from './styles';
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
