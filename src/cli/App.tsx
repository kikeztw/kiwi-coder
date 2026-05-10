import { useCallback } from 'react';
import { Box, useInput, useApp } from 'ink';
import { ModelSelector } from './components/ModelSelector.js';
import { SessionManager } from './components/SessionManager.js';
import { ChatView } from './components/ChatView.js';
import { SessionProvider, useSessionContext } from './context/SessionContext.js';
import { useViewMachine } from './hooks/useViewMachine.js';
import { parseCommand } from '../router/commandRouter.js';
import { clearTerminal } from './utils/terminal.js';



function AppContent() {
  const {
    session,
    currentSession,
    setCurrentAgent,
    sessions,
    selectSession: selectSessionContext,
    createSession,
    deleteCurrentSession,
    updateModelAndSave,
    saveCurrentSession,
    loadSessions,
  } = useSessionContext();

  const {
    view,
    sessionManagerMode,
    showChat,
    showModelSelector,
    showSessionSelector,
    selectModel,
    selectSession: selectSessionView,
    cancel,
    isSessionSelector,
  } = useViewMachine({
    saveCurrentSession,
    loadSessions,
  });
  const { exit } = useApp();

  // Handle session selection
  const handleSessionSelect = useCallback((sessionId: string) => {
    selectSessionContext(sessionId);
    selectSessionView(sessionId);
  }, [selectSessionContext, selectSessionView]);

  // Handle session manager selection
  const handleSessionManagerSelect = useCallback((sessionId: string) => {
    if (sessionManagerMode === 'delete') {
      deleteCurrentSession();
      showChat();
    } else {
      handleSessionSelect(sessionId);
    }
  }, [sessionManagerMode, deleteCurrentSession, showChat, handleSessionSelect]);

  // Handle session deletion
  const handleSessionDelete = useCallback((_sessionId: string) => {
    deleteCurrentSession();
    showChat();
  }, [deleteCurrentSession, showChat]);

  // Handle model selection
  const handleModelSelect = useCallback((provider: string, model: string, modelId: string) => {
    updateModelAndSave(provider, model, modelId, model);
    selectModel(provider, model, modelId);
  }, [updateModelAndSave, selectModel]);

  // Handle new session
  const handleNewSession = useCallback(() => {
    saveCurrentSession();
    createSession();
    showChat();
  }, [saveCurrentSession, createSession, showChat]);

  // Clear terminal and exit
  const handleExit = useCallback(() => {
    saveCurrentSession();
    clearTerminal();
    exit();
  }, [saveCurrentSession, exit]);

  // Handle Ctrl+C to exit (only when not in selector)
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      handleExit();
    }
  }, { isActive: !isSessionSelector });

  // Handle commands
  const handleSubmit = useCallback((value: string) => {
    const { isCommand, command } = parseCommand(value);

    if (isCommand) {
      if (command === 'coder' || command === 'plan') {
        setCurrentAgent(command);
        return;
      }

      if (command === 'model') {
        showModelSelector();
        return;
      }

      if (command === 'session' || command === 'sessions') {
        showSessionSelector('select');
        return;
      }

      if (command === 'new-session') {
        createSession();
        showChat();
        return;
      }

      if (command === 'delete-session') {
        if (sessions.length > 0) {
          showSessionSelector('delete');
        }
        return;
      }
    }
  }, [sessions.length, showModelSelector, showSessionSelector, handleNewSession, saveCurrentSession, setCurrentAgent, createSession]);

  // Render based on view
  if (view === 'session-selector') {
    return (
      <Box flexDirection="column">
        <SessionManager
          sessions={sessions}
          mode={sessionManagerMode || 'select'}
          onSelect={handleSessionManagerSelect}
          onDelete={handleSessionDelete}
          onCancel={cancel}
        />
      </Box>
    );
  }

  if (view === 'model-selector') {
    return (
      <Box flexDirection="column">
        <ModelSelector
          currentModelId={`${session.modelProvider}/${session.modelName}`}
          onSelect={handleModelSelect}
          onCancel={cancel}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <ChatView
        key={currentSession?.id}
        onSubmit={handleSubmit}
        onExit={handleExit}
      />
    </Box>
  );
}

export default function App({ projectPath }: { projectPath: string }) {
  return (
    <SessionProvider projectPath={projectPath} initialAgent="coder">
      <AppContent />
    </SessionProvider>
  );
}
