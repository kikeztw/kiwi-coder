import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { randomUUID } from 'crypto';
import type { PersistedSession, SessionInfo } from '../../workspace/sessionManager.js';
import {
  ensureKiwiDir,
  loadActiveSession,
  setActiveSession,
  createSession as createNewSession,
  listSessions,
  loadSession,
  deleteSession,
  saveSession,
  updateSessionModel,
} from '../../workspace/sessionManager.js';

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
  currentAgent: 'coder' | 'plan';
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
  setCurrentAgent: (agent: 'coder' | 'plan') => void;
  setStatus: (status: Session['status']) => void;
  updateModelAndSave: (provider: string, model: string, modelId: string, name: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode;
  projectPath: string;
  initialAgent?: 'coder' | 'plan';
}

export function SessionProvider({ children, projectPath, initialAgent = 'coder' }: SessionProviderProps) {
  const [currentSession, setCurrentSession] = useState<PersistedSession | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentAgent, setCurrentAgent] = useState<'coder' | 'plan'>(initialAgent);

  // Initialize session on mount
  useEffect(() => {
    ensureKiwiDir(projectPath);
    const loadedSessions = listSessions(projectPath);
    setSessions(loadedSessions);

    const activeSession = loadActiveSession(projectPath);
    if (activeSession) {
      setCurrentSession(activeSession);
    } else if (loadedSessions.length > 0) {
      const mostRecent = loadSession(projectPath, loadedSessions[0].id);
      if (mostRecent) {
        setCurrentSession(mostRecent);
        setActiveSession(projectPath, mostRecent.id);
      }
    } else {
      const newSession = createNewSession(projectPath, DEFAULT_MODEL, initialAgent);
      setCurrentSession(newSession);
      setActiveSession(projectPath, newSession.id);
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

  const loadSessions = useCallback(() => {
    setSessions(listSessions(projectPath));
  }, [projectPath]);

  const selectSession = useCallback((sessionId: string) => {
    const loaded = loadSession(projectPath, sessionId);
    if (loaded) {
      setCurrentSession(loaded);
      setActiveSession(projectPath, sessionId);
      setSessions(listSessions(projectPath));
    }
  }, [projectPath]);

  const createSession = useCallback((agent?: string) => {
    const newSession = createNewSession(projectPath, DEFAULT_MODEL, agent || currentAgent);
    setCurrentSession(newSession);
    setActiveSession(projectPath, newSession.id);
    setSessions(listSessions(projectPath));
    return newSession;
  }, [projectPath, currentAgent]);

  const deleteCurrentSession = useCallback(() => {
    if (!currentSession) return;
    deleteSession(projectPath, currentSession.id);
    const remaining = listSessions(projectPath);
    setSessions(remaining);

    if (remaining.length > 0) {
      const next = loadSession(projectPath, remaining[0].id);
      if (next) {
        setCurrentSession(next);
        setActiveSession(projectPath, next.id);
      }
    } else {
      const newSession = createNewSession(projectPath, DEFAULT_MODEL, currentAgent);
      setCurrentSession(newSession);
      setActiveSession(projectPath, newSession.id);
      setSessions(listSessions(projectPath));
    }
  }, [projectPath, currentSession, currentAgent]);

  const saveCurrentSession = useCallback(() => {
    if (currentSession) {
      saveSession(projectPath, currentSession);
    }
  }, [projectPath, currentSession]);

  const setProvider = useCallback((provider: string) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return { ...prev, model: { ...prev.model, provider } };
    });
  }, []);

  const setModel = useCallback((model: string) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return { ...prev, model: { ...prev.model, model, modelId: `${prev.model.provider}/${model}` } };
    });
  }, []);

  const setStatus = useCallback((_status: Session['status']) => {
    // Status is local UI state, not persisted
  }, []);

  const updateModelAndSave = useCallback((provider: string, model: string, modelId: string, name: string) => {
    if (currentSession) {
      const updated = updateSessionModel(projectPath, currentSession.id, provider, model, modelId, name);
      setCurrentSession(updated);
    }
  }, [projectPath, currentSession]);

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
