import { useCallback, useEffect, useState } from 'react';
import { Box, useInput, useApp } from 'ink';
import { ModelSelector } from './components/ModelSelector.js';
import { SessionManager } from './components/SessionManager.js';
import { SessionSelector } from './components/SessionSelector.js';
import { ChatView } from './components/ChatView.js';
import { useSession } from './hooks/useSession.js';
import { useViewManager } from './hooks/useViewManager.js';
import { agentRegistry } from '../agents/index.js';
import { parseCommand } from '../router/commandRouter.js';
import { getAllModels } from '../providers/index.js';
import { loadWorkspaceConfig, updateModelInConfig } from '../workspace/config.js';
import { listSessions, loadSession, saveSession, createSession, deleteSession, type PersistedSession, type SessionInfo } from '../workspace/sessionManager.js';
import { clearTerminal } from './utils/terminal.js';

interface AppProps {
  projectPath: string;
}

export default function App({ projectPath }: AppProps) {
  const { session, setProvider, setModel, loadPersistedSession } = useSession();
  const { view, showChat, showModelSelector, showSessionManager, isSessionSelector, isSessionManager } = useViewManager();
  const { exit } = useApp();
  
  const [currentAgent, setCurrentAgent] = useState(agentRegistry.getCurrentName());
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSession, setCurrentSession] = useState<PersistedSession | null>(null);
  const [sessionManagerMode, setSessionManagerMode] = useState<'select' | 'load' | 'delete'>('select');

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = listSessions(projectPath);
    setSessions(loadedSessions);
    
    if (loadedSessions.length === 0) {
      // No existing sessions, create new one
      const config = loadWorkspaceConfig(projectPath);
      const newSession = createSession(
        projectPath,
        config.model,
        agentRegistry.getCurrentName()
      );
      setCurrentSession(newSession);
      loadPersistedSession(newSession);
      showChat();
    }
  }, [projectPath, loadPersistedSession, showChat]);

  // Handle session selection
  const handleSessionSelect = useCallback((sessionId: string) => {
    const loaded = loadSession(projectPath, sessionId);
    if (loaded) {
      setCurrentSession(loaded);
      loadPersistedSession(loaded);
      // Update model from session
      setProvider(loaded.model.provider);
      setModel(loaded.model.model);
      showChat();
    }
  }, [projectPath, loadPersistedSession, setProvider, setModel, showChat]);

  // Handle session manager selection
  const handleSessionManagerSelect = useCallback((sessionId: string) => {
    if (sessionManagerMode === 'delete') {
      deleteSession(projectPath, sessionId);
      setSessions(listSessions(projectPath));
      showChat();
    } else {
      handleSessionSelect(sessionId);
    }
  }, [sessionManagerMode, projectPath, handleSessionSelect]);

  // Handle session deletion
  const handleSessionDelete = useCallback((sessionId: string) => {
    deleteSession(projectPath, sessionId);
    setSessions(listSessions(projectPath));
    showChat();
  }, [projectPath]);

  // Handle model selection
  const handleModelSelect = useCallback((provider: string, model: string, modelId: string) => {
    setProvider(provider);
    setModel(model);
    const modelInfo = getAllModels().find(m => m.id === modelId);
    // Save to workspace config
    updateModelInConfig(projectPath, provider, model, modelId, modelInfo?.name || model);
    // Update current session model
    if (currentSession) {
      const updated = {
        ...currentSession,
        model: {
          provider,
          model,
          modelId,
          name: modelInfo?.name || model,
        },
      };
      setCurrentSession(updated);
      saveSession(projectPath, updated);
    }
    clearTerminal();
    showChat();
  }, [projectPath, currentSession, setProvider, setModel]);

  // Handle new session
  const handleNewSession = useCallback(() => {
    const config = loadWorkspaceConfig(projectPath);
    const newSession = createSession(
      projectPath,
      config.model,
      agentRegistry.getCurrentName()
    );
    setCurrentSession(newSession);
    loadPersistedSession(newSession);
    showChat();
  }, [projectPath, loadPersistedSession, showChat]);

  // Clear terminal and exit
  const handleExit = useCallback(() => {
    // Save current session before exit
    if (currentSession) {
      saveSession(projectPath, currentSession);
    }
    clearTerminal();
    exit();
  }, [exit, currentSession, projectPath]);

  // Handle Ctrl+C to exit (only when not in selector/manager)
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      handleExit();
    }
  }, { isActive: !isSessionSelector && !isSessionManager });

  // Handle commands (simplified - now handled in ChatView mostly)
  const handleSubmit = useCallback((value: string) => {
    const { isCommand, command } = parseCommand(value);
    
    if (isCommand) {
      // Handle commands that affect the UI/navigation
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
        const allSessions = listSessions(projectPath);
        if (allSessions.length > 0) {
          setSessions(allSessions);
          setSessionManagerMode('select');
          showSessionManager();
        }
        return;
      }

      if (command === 'load') {
        const allSessions = listSessions(projectPath);
        if (allSessions.length > 0) {
          setSessions(allSessions);
          setSessionManagerMode('load');
          showSessionManager();
        }
        return;
      }

      if (command === 'new-session') {
        if (currentSession) {
          saveSession(projectPath, currentSession);
        }
        handleNewSession();
        return;
      }

      if (command === 'delete-session') {
        const allSessions = listSessions(projectPath);
        if (allSessions.length > 0) {
          setSessions(allSessions);
          setSessionManagerMode('delete');
          showSessionManager();
        }
        return;
      }
    }
    // Regular messages are handled by ChatView's queue
  }, [projectPath, currentSession, showModelSelector, showSessionManager, handleNewSession]);

  const modelDisplayName = getAllModels().find(m => m.id === `${session.modelProvider}/${session.modelName}`)?.name;

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

  if(view === 'model-selector') {
    return(
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
        session={session}
        currentAgent={currentAgent}
        modelDisplayName={modelDisplayName}
        onSubmit={handleSubmit}
        onExit={handleExit}
      />
    </Box>
  );
}

