import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { randomUUID } from 'crypto';
import type { PersistedSession } from '../../workspace/sessionManager.js';
import { 
  loadActiveSession, 
  saveActiveSession, 
  createSession as createNewSession,
  listSessions,
  loadSession,
  deleteSession,
  updateSessionModel,
  type SessionInfo 
} from '../../workspace/sessionManager.js';
import { ModelMessage } from 'ai';

// Default model configuration
const DEFAULT_MODEL = {
  provider: process.env.MODEL_PROVIDER || 'openai',
  model: process.env.MODEL_NAME || 'gpt-4o',
  modelId: `${process.env.MODEL_PROVIDER || 'openai'}/${process.env.MODEL_NAME || 'gpt-4o'}`,
  name: process.env.MODEL_NAME || 'gpt-4o',
};

export interface Session {
  id: string;
  startTime: Date;
  status: 'idle' | 'thinking' | 'acting' | 'reviewing' | 'error';
  modelProvider: string;
  modelName: string;
}

interface SessionContextType {
  // Current session state
  session: Session;
  currentSession: PersistedSession | null;
  currentAgent: string;
  modelDisplayName: string;
  projectPath: string;
  
  // Session management
  sessions: SessionInfo[];
  loadSessions: () => void;
  selectSession: (sessionId: string) => void;
  createSession: (agent?: string) => PersistedSession;
  deleteCurrentSession: () => void;
  saveCurrentSession: () => void;
  
  // Setters
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setCurrentAgent: (agent: string) => void;
  setStatus: (status: Session['status']) => void;
  updateModelAndSave: (provider: string, model: string, modelId: string, name: string) => void;
  
  // Messages
  addMessage: (message: ModelMessage[]) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode;
  projectPath: string;
  initialAgent?: string;
}

export function SessionProvider({ children, projectPath, initialAgent = 'coder' }: SessionProviderProps) {
  // Load active session or create default
  const [currentSession, setCurrentSession] = useState<PersistedSession | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentAgent, setCurrentAgent] = useState(initialAgent);
  
  // Initialize session on mount
  useEffect(() => {
    const loadedSessions = listSessions(projectPath);
    setSessions(loadedSessions);
    
    // Try to load active session
    const activeSession = loadActiveSession(projectPath);
    if (activeSession) {
      setCurrentSession(activeSession);
    } else if (loadedSessions.length > 0) {
      // Load most recent session
      const mostRecent = loadSession(projectPath, loadedSessions[0].id);
      if (mostRecent) {
        setCurrentSession(mostRecent);
        saveActiveSession(projectPath, mostRecent);
      }
    } else {
      // Create new session with default model
      const newSession = createNewSession(projectPath, DEFAULT_MODEL, initialAgent);
      setCurrentSession(newSession);
      saveActiveSession(projectPath, newSession);
      setSessions(listSessions(projectPath));
    }
  }, [projectPath, initialAgent]);
  
  // Derived session state for UI
  const session: Session = {
    id: currentSession?.id || randomUUID(),
    startTime: currentSession ? new Date(currentSession.created) : new Date(),
    status: 'idle',
    modelProvider: currentSession?.model.provider || 'openai',
    modelName: currentSession?.model.model || 'gpt-4o',
  };
  
  const modelDisplayName = currentSession?.model.name || session.modelName;
  
  // Actions
  const loadSessions = useCallback(() => {
    setSessions(listSessions(projectPath));
  }, [projectPath]);
  
  const selectSession = useCallback((sessionId: string) => {
    const loaded = loadSession(projectPath, sessionId);
    if (loaded) {
      setCurrentSession(loaded);
      saveActiveSession(projectPath, loaded);
    }
  }, [projectPath]);
  
  const createSession = useCallback((agent?: string) => {
    const newSession = createNewSession(projectPath, DEFAULT_MODEL, agent || currentAgent);
    setCurrentSession(newSession);
    saveActiveSession(projectPath, newSession);
    setSessions(listSessions(projectPath));
    return newSession;
  }, [projectPath, currentAgent]);
  
  const deleteCurrentSession = useCallback(() => {
    if (currentSession) {
      deleteSession(projectPath, currentSession.id);
      const remaining = listSessions(projectPath);
      setSessions(remaining);
      
      if (remaining.length > 0) {
        selectSession(remaining[0].id);
      } else {
        const newSession = createNewSession(projectPath, DEFAULT_MODEL, currentAgent);
        setCurrentSession(newSession);
        saveActiveSession(projectPath, newSession);
        setSessions(listSessions(projectPath));
      }
    }
  }, [projectPath, currentSession, currentAgent, selectSession]);
  
  const saveCurrentSession = useCallback(() => {
    if (currentSession) {
      saveActiveSession(projectPath, currentSession);
    }
  }, [projectPath, currentSession]);
  
  const setProvider = useCallback((provider: string) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        model: { ...prev.model, provider },
      };
      return updated;
    });
  }, []);
  
  const setModel = useCallback((model: string) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        model: { ...prev.model, model, modelId: `${prev.model.provider}/${model}` },
      };
      return updated;
    });
  }, []);
  
  const setStatus = useCallback((_status: Session['status']) => {
    // Status is local UI state, not persisted - intentionally unused
  }, []);
  
  const updateModelAndSave = useCallback((provider: string, model: string, modelId: string, name: string) => {
    if (currentSession) {
      const updated = updateSessionModel(projectPath, currentSession.id, provider, model, modelId, name);
      setCurrentSession(updated);
      saveActiveSession(projectPath, updated);
    }
  }, [projectPath, currentSession]);
  
  const addMessage = useCallback((messages: ModelMessage[]) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        messages,
        messageCount: messages.length + 1,
        lastActive: new Date().toISOString(),
      };
      // Auto-save on new message
      saveActiveSession(projectPath, updated);
      return updated;
    });
  }, [projectPath]);
  
  const value: SessionContextType = {
    session,
    currentSession,
    currentAgent,
    modelDisplayName,
    projectPath,
    sessions,
    loadSessions,
    selectSession,
    createSession,
    deleteCurrentSession,
    saveCurrentSession,
    setProvider,
    setModel,
    setCurrentAgent,
    setStatus,
    updateModelAndSave,
    addMessage,
  };
  
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}
