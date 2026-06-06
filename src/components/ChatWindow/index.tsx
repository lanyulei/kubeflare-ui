import { ChatSidebar, ConversationPanel, PromptComposer } from './components';
import { useStyles } from './styles';
import { useChatSessions } from './useChatSessions';

const ChatWindow = () => {
  const { styles } = useStyles();
  const {
    activeSession,
    createSession,
    deleteSession,
    draft,
    editMessage,
    loading,
    selectSession,
    sendMessage,
    sessions,
    setDraft,
    submitting,
  } = useChatSessions();

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
          disabled={!activeSession || loading || submitting}
          value={draft}
          onChange={setDraft}
          onSubmit={sendMessage}
        />
      </main>
    </div>
  );
};

export default ChatWindow;
