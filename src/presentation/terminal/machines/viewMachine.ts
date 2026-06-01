import { setup, assign } from 'xstate';
import { clearTerminal } from '../services/terminal.js';

export type ViewType = 'chat' | 'model-selector' | 'session-selector';

export interface ViewMachineContext {
  currentView: ViewType;
  sessionManagerMode?: 'select' | 'load' | 'delete';
  previousView?: ViewType;
  history: Array<{ view: ViewType; timestamp: number }>;
}

export type ViewMachineEvent =
  | { type: 'SHOW_MODEL_SELECTOR' }
  | { type: 'SHOW_SESSION_SELECTOR'; mode?: 'select' | 'load' | 'delete' }
  | { type: 'SHOW_CHAT' }
  | { type: 'SELECT_MODEL'; provider: string; model: string; modelId: string }
  | { type: 'SELECT_SESSION'; sessionId: string }
  | { type: 'CANCEL' };

export const viewMachine = setup({
  types: {
    context: {} as ViewMachineContext,
    events: {} as ViewMachineEvent,
  },
  actions: {
    clearTerminal: () => {
      clearTerminal();
    },
    saveCurrentSession: () => {
      // Provided by hook integration
    },
    loadSessions: () => {
      // Provided by hook integration
    },
    updateHistory: assign({
      history: ({ context }) => {
        const newEntry = { view: context.currentView, timestamp: Date.now() };
        return [...context.history, newEntry];
      },
      previousView: ({ context }) => context.currentView,
    }),
    setSessionManagerMode: assign({
      sessionManagerMode: (_, params: { mode?: 'select' | 'load' | 'delete' }) => params.mode,
    }),
  },
}).createMachine({
  id: 'view',
  initial: 'chat',
  context: {
    currentView: 'chat',
    history: [],
  },
  states: {
    chat: {
      entry: [
        { type: 'clearTerminal' },
        { type: 'updateHistory' },
      ],
      on: {
        SHOW_MODEL_SELECTOR: {
          target: 'model-selector',
          actions: [
            { type: 'saveCurrentSession' },
            { type: 'updateHistory' },
          ],
        },
        SHOW_SESSION_SELECTOR: {
          target: 'session-selector',
          actions: [
            { type: 'saveCurrentSession' },
            { type: 'updateHistory' },
            {
              type: 'setSessionManagerMode',
              params: ({ event }) => ({ mode: event.mode }),
            },
          ],
        },
      },
    },
    'model-selector': {
      entry: [
        { type: 'clearTerminal' },
        { type: 'updateHistory' },
      ],
      on: {
        SHOW_CHAT: {
          target: 'chat',
          actions: [{ type: 'updateHistory' }],
        },
        SELECT_MODEL: {
          target: 'chat',
          actions: [{ type: 'updateHistory' }],
        },
        CANCEL: {
          target: 'chat',
          actions: [{ type: 'updateHistory' }],
        },
      },
    },
    'session-selector': {
      entry: [
        { type: 'clearTerminal' },
        { type: 'loadSessions' },
        { type: 'updateHistory' },
      ],
      on: {
        SHOW_CHAT: {
          target: 'chat',
          actions: [{ type: 'updateHistory' }],
        },
        SELECT_SESSION: {
          target: 'chat',
          actions: [{ type: 'updateHistory' }],
        },
        CANCEL: {
          target: 'chat',
          actions: [{ type: 'updateHistory' }],
        },
      },
    },
  },
});
