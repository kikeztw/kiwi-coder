import { useCallback, useEffect, useState } from 'react';
import { Box, useInput, useApp } from 'ink';
import { Chat } from './components/Chat.js';
import { Input } from './components/Input.js';
import { Header } from './components/Header.js';
import { StatusBar } from './components/StatusBar.js';
import { ModelSelector } from './components/ModelSelector.js';
import { SessionManager } from './components/SessionManager.js';
import { SessionSelector } from './components/SessionSelector.js';
import { useMessages } from './hooks/useMessages.js';
import { useSession } from './hooks/useSession.js';
import { useViewManager } from './hooks/useViewManager.js';
import { agentRegistry } from '../agents/index.js';
import { parseCommand } from '../router/commandRouter.js';
import { getAllModels } from '../providers/index.js';
import { loadWorkspaceConfig, updateModelInConfig } from '../workspace/config.js';
import {
  listSessions,
  loadSession,
  saveSession,
  createSession,
  deleteSession,
  type PersistedSession,
  type SessionInfo,
} from '../workspace/sessionManager.js';
import type { AgentContext } from '../types/index.js';

interface AppProps {
  projectPath: string;
}

export default function App({ projectPath }: AppProps) {
  const { messages, setAllMessages, addUserMessage, addAgentMessage, updateMessage, addSystemMessage, addDebugMessage, clearMessages } = useMessages();
  const { session, setStatus, setProvider, setModel, loadPersistedSession } = useSession();
  const { view, showChat, showModelSelector, showSessionManager, isSessionSelector, isSessionManager } = useViewManager();
  const { exit } = useApp();
  
  const [currentAgent, setCurrentAgent] = useState(agentRegistry.getCurrentName());
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSession, setCurrentSession] = useState<PersistedSession | null>(null);
  const [sessionManagerMode, setSessionManagerMode] = useState<'select' | 'load' | 'delete'>('select');
  const [debugMode, setDebugMode] = useState(false);

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
      setAllMessages([]);
      showChat();
    }
  }, [projectPath, loadPersistedSession, setAllMessages, showChat]);

  // Auto-save session every 5 messages (excluding debug messages)
  useEffect(() => {
    if (currentSession && messages.length > 0 && messages.length % 5 === 0) {
      const persistedMessages = messages.filter(m => m.role !== 'debug');
      const updatedSession: PersistedSession = {
        ...currentSession,
        messages: persistedMessages,
        lastActive: new Date().toISOString(),
      };
      saveSession(projectPath, updatedSession);
    }
  }, [messages, currentSession, projectPath]);

  // Handle session selection
  const handleSessionSelect = useCallback((sessionId: string) => {
    const loaded = loadSession(projectPath, sessionId);
    if (loaded) {
      setCurrentSession(loaded);
      loadPersistedSession(loaded);
      setAllMessages(loaded.messages);
      // Update model from session
      setProvider(loaded.model.provider);
      setModel(loaded.model.model);
      showChat();
    }
  }, [projectPath, loadPersistedSession, setAllMessages, setProvider, setModel, showChat]);

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
    setAllMessages([]);
    showChat();
    addSystemMessage('Started new session');
  }, [projectPath, loadPersistedSession, setAllMessages, showChat, addSystemMessage]);

  // Clear terminal and exit
  const handleExit = useCallback(() => {
    // Save current session before exit (excluding debug messages)
    if (currentSession) {
      const persistedMessages = messages.filter(m => m.role !== 'debug');
      const updatedSession: PersistedSession = {
        ...currentSession,
        messages: persistedMessages,
        lastActive: new Date().toISOString(),
      };
      saveSession(projectPath, updatedSession);
    }
    process.stdout.write('\x1Bc');
    exit();
  }, [exit, currentSession, messages, projectPath]);

  // Handle Ctrl+C to exit (only when not in selector/manager)
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      handleExit();
    }
  }, { isActive: !isSessionSelector && !isSessionManager });

  // Handle commands
  const handleCommand = useCallback((command: string, args: string[]) => {
    // Handle agent switching
    if (command === 'coder' || command === 'plan') {
      const success = agentRegistry.setCurrent(command);
      if (success) {
        setCurrentAgent(command);
        const agent = agentRegistry.get(command);
        addSystemMessage(`Switched to ${command} agent: ${agent?.description}`);
        // Update current session agent
        if (currentSession) {
          const updated = { ...currentSession, agent: command };
          setCurrentSession(updated);
          saveSession(projectPath, updated);
        }
      } else {
        addSystemMessage(`Failed to switch to ${command} agent`);
      }
      return;
    }

    // Handle model command
    if (command === 'model') {
      showModelSelector();
      return;
    }

    // Handle session commands
    if (command === 'sessions') {
      const allSessions = listSessions(projectPath);
      if (allSessions.length === 0) {
        addSystemMessage('No saved sessions found');
      } else {
        setSessions(allSessions);
        setSessionManagerMode('select');
        showSessionManager();
      }
      return;
    }

    if (command === 'load') {
      const allSessions = listSessions(projectPath);
      if (allSessions.length === 0) {
        addSystemMessage('No saved sessions found');
        return;
      }
      setSessions(allSessions);
      setSessionManagerMode('load');
      showSessionManager();
      return;
    }

    if (command === 'new-session') {
      // Save current session first (excluding debug messages)
      if (currentSession) {
        const persistedMessages = messages.filter(m => m.role !== 'debug');
        const updated = { ...currentSession, messages: persistedMessages };
        saveSession(projectPath, updated);
      }
      handleNewSession();
      return;
    }

    if (command === 'delete-session') {
      const allSessions = listSessions(projectPath);
      if (allSessions.length === 0) {
        addSystemMessage('No saved sessions found');
        return;
      }
      setSessions(allSessions);
      setSessionManagerMode('delete');
      showSessionManager();
      return;
    }

    // Handle debugger command
    if (command === 'debugger') {
      setDebugMode(prev => {
        const newMode = !prev;
        addSystemMessage(`Debug mode ${newMode ? 'enabled' : 'disabled'}`);
        return newMode;
      });
      return;
    }
    if (command === 'help') {
      const available = agentRegistry.list().join(', ');
      addSystemMessage(
        `Available agents: ${available}\n` +
        `Commands: /coder, /plan, /model, /help, exit/quit\n` +
        `Session commands: /sessions, /load, /new-session, /delete-session\n` +
        `Debug: /debugger (toggle debug mode)\n` +
        `CLI: kiwi [--path <project-path>]`
      );
      return;
    }

    addSystemMessage(`Unknown command: /${command}. Type /help for available commands.`);
  }, [projectPath, currentSession, messages, handleSessionSelect, handleNewSession, setCurrentAgent, addSystemMessage, setProvider, setModel, showModelSelector]);

  // Process message with agent
  const processMessage = useCallback(async (userInput: string) => {
    const { isCommand, command, args } = parseCommand(userInput);
    
    if (isCommand) {
      handleCommand(command, args);
      return;
    }

    if (debugMode) addDebugMessage('[PROCESS] Starting message processing');
    setStatus('thinking');

    const agent = agentRegistry.getCurrent();
    if (debugMode) addDebugMessage(`[PROCESS] Agent: ${agent.name}`);

    // Add empty agent message that will be updated during streaming
    const agentMessageId = addAgentMessage('');

    // Filter out debug messages and empty messages from context
    const contextMessages = messages
      .filter(m => m.role !== 'debug')
      .filter(m => m.content.trim() !== '');
    
    if (debugMode) {
      addDebugMessage(`[PROCESS] Total messages: ${messages.length}, After filtering: ${contextMessages.length}`);
      contextMessages.forEach((m, i) => {
        addDebugMessage(`[PROCESS] Message ${i}: role=${m.role}, content.length=${m.content.length}`);
      });
    }
    
    const context: AgentContext = {
      messages: contextMessages.map(m => ({
        role: m.role === 'agent' ? 'assistant' : m.role === 'user' ? 'user' : 'system',
        content: m.content,
      }) as { role: 'user' | 'assistant' | 'system'; content: string }),
      sessionId: session.id,
      modelProvider: session.modelProvider,
      modelName: session.modelName,
    };

    if (debugMode) {
      addDebugMessage(`[PROCESS] Model: ${session.modelProvider}/${session.modelName}`);
      addDebugMessage(`[PROCESS] Context messages: ${contextMessages.length}`);
    }

    try {
      if (debugMode) addDebugMessage('[PROCESS] Starting agent.process()');
      let fullResponse = '';
      let chunkCount = 0;

      for await (const chunk of agent.process(userInput, context)) {
        chunkCount++;
        fullResponse += chunk;
        updateMessage(agentMessageId, fullResponse);
        
        if (debugMode && chunkCount % 5 === 0) {
          addDebugMessage(`[PROCESS] Received chunk ${chunkCount}`);
        }
      }

      if (debugMode) {
        addDebugMessage(`[PROCESS] Complete. Total chunks: ${chunkCount}, length: ${fullResponse.length}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (debugMode) {
        addDebugMessage(`[ERROR] ${error instanceof Error ? error.constructor.name : typeof error}: ${errorMsg}`);
        if (error instanceof Error && error.stack) {
          addDebugMessage(`[ERROR] Stack: ${error.stack.split('\n').slice(0, 3).join(' | ')}`);
        }
      }
      addSystemMessage(`Error: ${errorMsg}`);
    } finally {
      if (debugMode) addDebugMessage('[PROCESS] Status -> idle');
      setStatus('idle');
    }
  }, [messages, session, addAgentMessage, addSystemMessage, addDebugMessage, setStatus, handleCommand, debugMode]);

  const handleSubmit = useCallback((value: string) => {
    if (value.toLowerCase() === 'exit' || value.toLowerCase() === 'quit') {
      handleExit();
      return;
    }

    addUserMessage(value);
    processMessage(value);
  }, [addUserMessage, processMessage, handleExit]);

  // Render based on view
  if (view === 'session-selector') {
    return (
      <SessionSelector
        sessions={sessions}
        onSelect={handleSessionSelect}
        onNew={handleNewSession}
        onCancel={handleExit}
      />
    );
  }

  if (view === 'session-manager') {
    return (
      <SessionManager
        sessions={sessions}
        mode={sessionManagerMode}
        onSelect={(sessionId) => {
          if (sessionManagerMode === 'delete') {
            // Delete and refresh
            deleteSession(projectPath, sessionId);
            setSessions(listSessions(projectPath));
            showChat();
            addSystemMessage(`Deleted session ${sessionId}`);
          } else {
            // Load the session
            handleSessionSelect(sessionId);
            if (sessionManagerMode === 'select') {
              addSystemMessage(`Switched to session ${sessionId}`);
            } else {
              addSystemMessage(`Loaded session ${sessionId}`);
            }
          }
        }}
        onDelete={(sessionId) => {
          deleteSession(projectPath, sessionId);
          setSessions(listSessions(projectPath));
          showChat();
          addSystemMessage(`Deleted session ${sessionId}`);
        }}
        onCancel={() => showChat()}
      />
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      {view === 'model-selector' ? (
        <ModelSelector
          currentModelId={`${session.modelProvider}/${session.modelName}`}
          onSelect={(provider, model, modelId) => {
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
            addSystemMessage(`Switched to ${modelInfo?.name || modelId} (saved to ${projectPath}/.kiwi.json)`);
            showChat();
          }}
          onCancel={() => showChat()}
        />
      ) : (
        <Box flexDirection="column">
          <Header
            modelName={getAllModels().find(m => m.id === `${session.modelProvider}/${session.modelName}`)?.name}
            modelProvider={session.modelProvider}
            currentAgent={currentAgent}
            status={session.status}
          />

          <Chat messages={messages} />

          <StatusBar
            session={session}
            currentAgent={currentAgent}
            modelDisplayName={getAllModels().find(m => m.id === `${session.modelProvider}/${session.modelName}`)?.name}
          />

          <Input
            onSubmit={handleSubmit}
            disabled={session.status === 'thinking'}
            placeholder={session.status === 'thinking' ? 'Agent is thinking...' : 'Type your message (or exit/quit to close)...'}
          />
        </Box>
      )}
    </Box>
  );
}