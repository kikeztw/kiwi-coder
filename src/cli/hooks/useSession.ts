import { useState, useCallback } from 'react';
import { randomUUID } from 'crypto';
import type { PersistedSession } from '../../workspace/sessionManager.js';

export interface Session {
  id: string;
  startTime: Date;
  status: 'idle' | 'thinking' | 'acting' | 'reviewing' | 'error';
  modelProvider: string;
  modelName: string;
}

export function useSession() {
  const [session, setSession] = useState<Session>({
    id: randomUUID(),
    startTime: new Date(),
    status: 'idle',
    modelProvider: process.env.MODEL_PROVIDER || 'openai',
    modelName: process.env.MODEL_NAME || 'gpt-4o',
  });

  const setStatus = useCallback((status: Session['status']) => {
    setSession(prev => ({ ...prev, status }));
  }, []);

  const setProvider = useCallback((provider: string) => {
    setSession(prev => ({ ...prev, modelProvider: provider }));
  }, []);

  const setModel = useCallback((model: string) => {
    setSession(prev => ({ ...prev, modelName: model }));
  }, []);

  const resetSession = useCallback(() => {
    setSession({
      id: randomUUID(),
      startTime: new Date(),
      status: 'idle',
      modelProvider: process.env.MODEL_PROVIDER || 'openai',
      modelName: process.env.MODEL_NAME || 'gpt-4o',
    });
  }, []);

  const loadPersistedSession = useCallback((persisted: PersistedSession) => {
    setSession({
      id: persisted.id,
      startTime: new Date(persisted.created),
      status: 'idle',
      modelProvider: persisted.model.provider,
      modelName: persisted.model.model,
    });
  }, []);

  return {
    session,
    setStatus,
    setProvider,
    setModel,
    resetSession,
    loadPersistedSession,
  };
}
