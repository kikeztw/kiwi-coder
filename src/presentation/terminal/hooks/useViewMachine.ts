import { useMachine } from '@xstate/react';
import { viewMachine, ViewType } from '../machines/viewMachine.js';

interface UseViewMachineOptions {
  saveCurrentSession?: () => void | Promise<void>;
  loadSessions?: () => void | Promise<void>;
}

export function useViewMachine(options: UseViewMachineOptions = {}) {
  const [state, send] = useMachine(viewMachine);

  const view = state.value as ViewType;
  const sessionManagerMode = state.context.sessionManagerMode;

  const showChat = () => send({ type: 'SHOW_CHAT' });
  const showModelSelector = () => {
    if (options.saveCurrentSession) {
      options.saveCurrentSession();
    }
    send({ type: 'SHOW_MODEL_SELECTOR' });
  };
  const showSessionSelector = (mode?: 'select' | 'load' | 'delete') => {
    if (options.saveCurrentSession) {
      options.saveCurrentSession();
    }
    send({ type: 'SHOW_SESSION_SELECTOR', mode });
  };
  const selectModel = (provider: string, model: string, modelId: string) =>
    send({ type: 'SELECT_MODEL', provider, model, modelId });
  const selectSession = (sessionId: string) => {
    if (options.loadSessions) {
      options.loadSessions();
    }
    send({ type: 'SELECT_SESSION', sessionId });
  };
  const cancel = () => send({ type: 'CANCEL' });

  const isChat = view === 'chat';
  const isModelSelector = view === 'model-selector';
  const isSessionSelector = view === 'session-selector';

  return {
    view,
    sessionManagerMode,
    showChat,
    showModelSelector,
    showSessionSelector,
    selectModel,
    selectSession,
    cancel,
    isChat,
    isModelSelector,
    isSessionSelector,
    state,
  };
}
