import {
  resolveTerminalCommand,
  type TerminalRouteAction,
} from '../router/TerminalRouter.js';

type TerminalNavigationDeps = {
  setCurrentAgent: (agent: 'coder' | 'plan') => void;
  showModelSelector: () => void;
  showSessionSelector: (mode?: 'select' | 'load' | 'delete') => void;
  createSession: () => Promise<void>;
  sessionCount: number;
};

function handleAction(action: TerminalRouteAction, deps: TerminalNavigationDeps): void {
  switch (action.type) {
    case 'set-agent':
      deps.setCurrentAgent(action.agent);
      return;
    case 'show-model-selector':
      deps.showModelSelector();
      return;
    case 'show-session-selector':
      if (action.mode === 'select' || deps.sessionCount > 0) {
        deps.showSessionSelector(action.mode);
      }
      return;
    case 'create-session':
      void deps.createSession();
      return;
    case 'message':
    case 'unknown-command':
      return;
  }
}

export function createTerminalNavigationService(deps: TerminalNavigationDeps) {
  return {
    handleInput(input: string): void {
      const action = resolveTerminalCommand(input);
      handleAction(action, deps);
    },
  };
}
