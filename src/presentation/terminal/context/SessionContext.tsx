import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { UIMessage } from 'ai';
import { randomUUID } from 'crypto';
import type { ModelDTO, SessionDTO, SessionSummaryDTO } from '../../../application/index.js';
import { createApplicationServices } from '../../../infrastructure/index.js';

const DEFAULT_MODEL = {
  provider: process.env.MODEL_PROVIDER || 'openai',
  model: process.env.MODEL_NAME || 'gpt-4o',
  modelId: `${process.env.MODEL_PROVIDER || 'openai'}/${process.env.MODEL_NAME || 'gpt-4o'}`,
  name: process.env.MODEL_NAME || 'gpt-4o',
};

function defaultModelDTO(): ModelDTO {
  return {
    id: DEFAULT_MODEL.modelId,
    provider: DEFAULT_MODEL.provider,
    model: DEFAULT_MODEL.model,
    name: DEFAULT_MODEL.name,
    isDefault: true,
  };
}

export interface Session {
  id: string;
  startTime: Date;
  status: 'idle' | 'thinking' | 'acting' | 'reviewing' | 'error';
  modelProvider: string;
  modelName: string;
}

interface SessionContextType {
  session: Session;
  currentSession: SessionDTO | null;
  currentAgent: 'coder' | 'plan';
  modelDisplayName: string;
  projectPath: string;
  loadSessionMessages: (sessionId: string) => UIMessage[];
  saveSessionMessages: (sessionId: string, messages: UIMessage[]) => void;

  sessions: SessionSummaryDTO[];
  loadSessions: () => void;
  selectSession: (sessionId: string) => Promise<void>;
  createSession: (agent?: string) => Promise<SessionDTO | null>;
  deleteCurrentSession: () => Promise<void>;
  saveCurrentSession: () => void;

  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setCurrentAgent: (agent: 'coder' | 'plan') => void;
  setStatus: (status: Session['status']) => void;
  updateModelAndSave: (provider: string, model: string, modelId: string, name: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode;
  projectPath: string;
  initialAgent?: 'coder' | 'plan';
}

export function SessionProvider({ children, projectPath, initialAgent = 'coder' }: SessionProviderProps) {
  const [currentSession, setCurrentSession] = useState<SessionDTO | null>(null);
  const [sessions, setSessions] = useState<SessionSummaryDTO[]>([]);
  const [currentAgent, setCurrentAgent] = useState<'coder' | 'plan'>(initialAgent);
  const application = useMemo(() => createApplicationServices(projectPath), [projectPath]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const result = await application.sessions.initialize({
        projectPath,
        defaultModel: defaultModelDTO(),
        initialAgent,
      });

      if (!cancelled) {
        setCurrentSession(result.currentSession);
        setCurrentAgent(result.currentSession.agent as 'coder' | 'plan');
        setSessions(result.sessions);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [application, initialAgent, projectPath]);

  const session: Session = {
    id: currentSession?.id || randomUUID(),
    startTime: currentSession ? new Date(currentSession.created) : new Date(),
    status: 'idle',
    modelProvider: currentSession?.model.provider || 'openai',
    modelName: currentSession?.model.model || 'gpt-4o',
  };

  const modelDisplayName = currentSession?.model.name || session.modelName;

  const loadSessions = useCallback(() => {
    void application.sessions.list().then(setSessions);
  }, [application]);

  const loadSessionMessages = useCallback(
    (sessionId: string) => application.messages.loadSnapshot(sessionId),
    [application],
  );

  const saveSessionMessages = useCallback(
    (sessionId: string, messages: UIMessage[]) => application.messages.saveSnapshot(sessionId, messages),
    [application],
  );

  const selectSession = useCallback(async (sessionId: string) => {
    const loaded = await application.sessions.select(sessionId);
    if (loaded) {
      setCurrentSession(loaded);
      setCurrentAgent(loaded.agent as 'coder' | 'plan');
      setSessions(await application.sessions.list());
    }
  }, [application]);

  const createSession = useCallback(async (agent?: string) => {
    const created = await application.sessions.create({
      projectPath,
      model: defaultModelDTO(),
      agent: agent || currentAgent,
    });

    setCurrentSession(created);
    setCurrentAgent(created.agent as 'coder' | 'plan');
    setSessions(await application.sessions.list());
    return created;
  }, [application, projectPath, currentAgent]);

  const deleteCurrentSession = useCallback(async () => {
    if (!currentSession) return;
    await application.sessions.delete(currentSession.id);
    const remaining = await application.sessions.list();
    setSessions(remaining);

    if (remaining.length > 0) {
      const next = await application.sessions.select(remaining[0].id);
      if (next) {
        setCurrentSession(next);
        setCurrentAgent(next.agent as 'coder' | 'plan');
      }
    } else {
      await createSession(currentAgent);
    }
  }, [application, currentSession, currentAgent, createSession]);

  const saveCurrentSession = useCallback(() => {
    if (currentSession) {
      void application.sessions.save(currentSession);
    }
  }, [application, currentSession]);

  const setProvider = useCallback((provider: string) => {
    setCurrentSession((prev) => {
      if (!prev) return prev;
      return { ...prev, model: { ...prev.model, provider } };
    });
  }, []);

  const setModel = useCallback((model: string) => {
    setCurrentSession((prev) => {
      if (!prev) return prev;
      return { ...prev, model: { ...prev.model, model, modelId: `${prev.model.provider}/${model}` } };
    });
  }, []);

  const setStatus = useCallback((_status: Session['status']) => {
    // Status is local UI state, not persisted
  }, []);

  const updateModelAndSave = useCallback(async (provider: string, model: string, modelId: string, name: string) => {
    if (currentSession) {
      const updated = await application.sessions.changeSessionModel({
        sessionId: currentSession.id,
        model: {
          id: modelId,
          provider,
          model,
          name,
          isDefault: false,
        },
      });
      setCurrentSession(updated);
    }
  }, [application, currentSession]);

  const value: SessionContextType = {
    session,
    currentSession,
    currentAgent,
    modelDisplayName,
    projectPath,
    loadSessionMessages,
    saveSessionMessages,
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
