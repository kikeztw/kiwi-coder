import { useCallback, useState } from 'react';
import { Box, useInput, useApp } from 'ink';
import { ModelSelector } from './components/ModelSelector.js';
import { SessionManager } from './components/SessionManager.js';
import { SessionSelector } from './components/SessionSelector.js';
import { ChatView } from './components/ChatView.js';
import { SessionProvider, useSessionContext } from './context/SessionContext.js';
import { useViewManager } from './hooks/useViewManager.js';
import { agentRegistry } from '../agents/index.js';
import { parseCommand } from '../router/commandRouter.js';
import { clearTerminal } from './utils/terminal.js';



function AppContent() {
  const { 
    session, 
    currentAgent, 
    setCurrentAgent,
    sessions,
    selectSession,
    createSession,
    deleteCurrentSession,
    updateModelAndSave,
    saveCurrentSession,
    loadSessions,
  } = useSessionContext();
  
  const { view, showChat, showModelSelector, showSessionManager, isSessionSelector, isSessionManager } = useViewManager();
  const { exit } = useApp();
  
  const [sessionManagerMode, setSessionManagerMode] = useState<'select' | 'load' | 'delete'>('select');

  // Handle session selection
  const handleSessionSelect = useCallback((sessionId: string) => {
    selectSession(sessionId);
    showChat();
  }, [selectSession, showChat]);

  // Handle session manager selection
  const handleSessionManagerSelect = useCallback((sessionId: string) => {
    if (sessionManagerMode === 'delete') {
      deleteCurrentSession();
      loadSessions();
      showChat();
    } else {
      handleSessionSelect(sessionId);
    }
  }, [sessionManagerMode, deleteCurrentSession, loadSessions, showChat, handleSessionSelect]);

  // Handle session deletion
  const handleSessionDelete = useCallback((_sessionId: string) => {
    deleteCurrentSession();
    loadSessions();
    showChat();
  }, [deleteCurrentSession, loadSessions, showChat]);

  // Handle model selection
  const handleModelSelect = useCallback((provider: string, model: string, modelId: string) => {
    updateModelAndSave(provider, model, modelId, model);
    clearTerminal();
    showChat();
  }, [updateModelAndSave, showChat]);

  // Handle new session
  const handleNewSession = useCallback(() => {
    saveCurrentSession();
    createSession(agentRegistry.getCurrentName());
    loadSessions();
    showChat();
  }, [saveCurrentSession, createSession, loadSessions, showChat]);

  // Clear terminal and exit
  const handleExit = useCallback(() => {
    saveCurrentSession();
    clearTerminal();
    exit();
  }, [saveCurrentSession, exit]);

  // Handle Ctrl+C to exit (only when not in selector/manager)
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      handleExit();
    }
  }, { isActive: !isSessionSelector && !isSessionManager });

  // Handle commands
  const handleSubmit = useCallback((value: string) => {
    const { isCommand, command } = parseCommand(value);
    
    if (isCommand) {
      if (command === 'coder' || command === 'plan') {
        const success = agentRegistry.setCurrent(command);
        if (success) {
          setCurrentAgent(command);
        }
        return;
      }

      if (command === 'model') {
        showModelSelector();
        return;
      }

      if (command === 'sessions') {
        loadSessions();
        if (sessions.length > 0) {
          setSessionManagerMode('select');
          showSessionManager();
        }
        return;
      }

      if (command === 'load') {
        loadSessions();
        if (sessions.length > 0) {
          setSessionManagerMode('load');
          showSessionManager();
        }
        return;
      }

      if (command === 'new-session') {
        saveCurrentSession();
        handleNewSession();
        return;
      }

      if (command === 'delete-session') {
        loadSessions();
        if (sessions.length > 0) {
          setSessionManagerMode('delete');
          showSessionManager();
        }
        return;
      }
    }
  }, [sessions.length, loadSessions, showModelSelector, showSessionManager, handleNewSession, saveCurrentSession, setCurrentAgent]);

  // Render based on view
  if (view === 'session-selector') {
    return (
      <Box flexDirection="column">
        <SessionSelector
          sessions={sessions}
          onSelect={handleSessionSelect}
          onNew={handleNewSession}
          onCancel={handleExit}
        />
      </Box>
    );
  }

  if (view === 'session-manager') {
    return (
      <Box flexDirection="column">
        <SessionManager
          sessions={sessions}
          mode={sessionManagerMode}
          onSelect={handleSessionManagerSelect}
          onDelete={handleSessionDelete}
          onCancel={() => showChat()}
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
          onCancel={() => showChat()}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <ChatView
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
