import { useState, useCallback } from 'react';

export type ViewType = 'session-selector' | 'chat' | 'model-selector' | 'session-manager';

export interface ViewManager {
  view: ViewType;
  setView: (view: ViewType) => void;
  showSessionSelector: () => void;
  showChat: () => void;
  showModelSelector: () => void;
  showSessionManager: () => void;
  isSessionSelector: boolean;
  isChat: boolean;
  isModelSelector: boolean;
  isSessionManager: boolean;
}

export function useViewManager(initialView: ViewType = 'session-selector'): ViewManager {
  const [view, setViewState] = useState<ViewType>(initialView);

  const setView = useCallback((newView: ViewType) => {
    setViewState(newView);
  }, []);

  const showSessionSelector = useCallback(() => {
    setViewState('session-selector');
  }, []);

  const showChat = useCallback(() => {
    setViewState('chat');
  }, []);

  const showModelSelector = useCallback(() => {
    setViewState('model-selector');
  }, []);

  const showSessionManager = useCallback(() => {
    setViewState('session-manager');
  }, []);

  return {
    view,
    setView,
    showSessionSelector,
    showChat,
    showModelSelector,
    showSessionManager,
    isSessionSelector: view === 'session-selector',
    isChat: view === 'chat',
    isModelSelector: view === 'model-selector',
    isSessionManager: view === 'session-manager',
  };
}
