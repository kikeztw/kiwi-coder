import { useCallback, useMemo } from 'react';
import { Box, useInput, useTui } from '@orchetron/storm';
import { ChatView } from './components/ChatView.js';
import { ModelSelector } from './components/ModelSelector.js';
import { SessionManager } from './components/SessionManager.js';
import { SessionProvider, useSessionContext } from './context/index.js';
import { useViewMachine } from './hooks/useViewMachine.js';
import { createTerminalNavigationService } from './services/TerminalNavigationService.js';
import { clearTerminal } from './services/terminal.js';

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
  const { exit } = useTui();

  const handleSessionSelect = useCallback(async (sessionId: string) => {
    await selectSessionContext(sessionId);
    selectSessionView(sessionId);
  }, [selectSessionContext, selectSessionView]);

  const handleSessionManagerSelect = useCallback(async (sessionId: string) => {
    if (sessionManagerMode === 'delete') {
      await deleteCurrentSession();
      showChat();
    } else {
      await handleSessionSelect(sessionId);
    }
  }, [sessionManagerMode, deleteCurrentSession, showChat, handleSessionSelect]);

  const handleSessionDelete = useCallback(async (_sessionId: string) => {
    await deleteCurrentSession();
    showChat();
  }, [deleteCurrentSession, showChat]);

  const handleModelSelect = useCallback(async (provider: string, model: string, modelId: string) => {
    await updateModelAndSave(provider, model, modelId, model);
    selectModel(provider, model, modelId);
  }, [updateModelAndSave, selectModel]);

  const handleNewSession = useCallback(async () => {
    saveCurrentSession();
    await createSession();
    showChat();
  }, [saveCurrentSession, createSession, showChat]);

  const navigationService = useMemo(
    () =>
      createTerminalNavigationService({
        setCurrentAgent,
        showModelSelector,
        showSessionSelector,
        createSession: handleNewSession,
        sessionCount: sessions.length,
      }),
    [setCurrentAgent, showModelSelector, showSessionSelector, handleNewSession, sessions.length],
  );

  const handleExit = useCallback(() => {
    saveCurrentSession();
    clearTerminal();
    exit();
  }, [saveCurrentSession, exit]);

  useInput((event) => {
    if (event.ctrl && event.key === 'c') {
      handleExit();
    }
  }, { isActive: !isSessionSelector });

  const handleSubmit = useCallback((value: string) => {
    navigationService.handleInput(value);
  }, [navigationService]);

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
      <ModelSelector
        visible
        currentModelId={`${session.modelProvider}/${session.modelName}`}
        onSelect={handleModelSelect}
        onCancel={cancel}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <ChatView
        key={currentSession?.id}
        onExecuteCommand={handleSubmit}
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
