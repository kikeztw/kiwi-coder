import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { UIMessage } from 'ai';
import { randomUUID } from 'crypto';
import type { ModelDTO, SessionDTO, SessionSummaryDTO } from '../../../application/index.js';
import { createApplicationServices } from '../../../infrastructure/index.js';

export type AgentMode = 'coder' | 'plan';

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
  currentAgent: AgentMode;
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
  setStatus: (status: Session['status']) => void;
  updateModelAndSave: (provider: string, model: string, modelId: string, name: string) => Promise<void>;
  updateAgentAndSave: (agent: AgentMode) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode;
  projectPath: string;
  initialAgent?: AgentMode;
}

function toAgentMode(agent: string): AgentMode {
  return agent === 'plan' ? 'plan' : 'coder';
}

export function SessionProvider({ children, projectPath, initialAgent = 'coder' }: SessionProviderProps) {
  const mountedRef = useRef(true);
  const [currentSession, setCurrentSession] = useState<SessionDTO | null>(null);
  const [sessions, setSessions] = useState<SessionSummaryDTO[]>([]);
  const [currentAgent, setCurrentAgent] = useState<AgentMode>(initialAgent);
  const application = useMemo(() => createApplicationServices(projectPath), [projectPath]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const result = await application.sessions.initialize({
        projectPath,
        defaultModel: defaultModelDTO(),
        initialAgent,
      });

      if (mountedRef.current) {
        setCurrentSession(result.currentSession);
        setCurrentAgent(toAgentMode(result.currentSession.agent));
        setSessions(result.sessions);
      }
    };

    void initialize();
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
    void application.sessions.list().then((loaded) => {
      if (mountedRef.current) {
        setSessions(loaded);
      }
    });
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
    if (loaded && mountedRef.current) {
      setCurrentSession(loaded);
      setCurrentAgent(toAgentMode(loaded.agent));
      setSessions(await application.sessions.list());
    }
  }, [application]);

  const createSession = useCallback(async (agent?: string) => {
    const created = await application.sessions.create({
      projectPath,
      model: defaultModelDTO(),
      agent: agent || currentAgent,
    });

    if (mountedRef.current) {
      setCurrentSession(created);
      setCurrentAgent(toAgentMode(created.agent));
      setSessions(await application.sessions.list());
    }
    return created;
  }, [application, projectPath, currentAgent]);

  const deleteCurrentSession = useCallback(async () => {
    if (!currentSession) return;
    await application.sessions.delete(currentSession.id);
    const remaining = await application.sessions.list();

    if (!mountedRef.current) return;
    setSessions(remaining);

    if (remaining.length > 0) {
      const next = await application.sessions.select(remaining[0].id);
      if (next && mountedRef.current) {
        setCurrentSession(next);
        setCurrentAgent(toAgentMode(next.agent));
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
    // Status is local UI state, not persisted.
  }, []);

  const updateModelAndSave = useCallback(async (provider: string, model: string, modelId: string, name: string) => {
    if (!currentSession) return;
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

    if (mountedRef.current) {
      setCurrentSession(updated);
    }
  }, [application, currentSession]);

  const updateAgentAndSave = useCallback(async (agent: AgentMode) => {
    if (!currentSession) return;
    const updated = await application.sessions.changeSessionAgent({
      sessionId: currentSession.id,
      agent,
    });

    if (mountedRef.current) {
      setCurrentSession(updated);
      setCurrentAgent(toAgentMode(updated.agent));
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
    setStatus,
    updateModelAndSave,
    updateAgentAndSave,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within SessionProvider');
  }
  return context;
}
