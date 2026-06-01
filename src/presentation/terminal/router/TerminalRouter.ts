export type TerminalRouteAction =
  | { type: 'message' }
  | { type: 'set-agent'; agent: 'coder' | 'plan' }
  | { type: 'show-model-selector' }
  | { type: 'show-session-selector'; mode: 'select' | 'delete' }
  | { type: 'create-session' }
  | { type: 'unknown-command'; command: string };

function parseTerminalCommand(input: string): { isCommand: boolean; command: string } {
  if (!input.startsWith('/')) {
    return { isCommand: false, command: '' };
  }

  const [command = ''] = input.slice(1).split(' ');
  return {
    isCommand: true,
    command: command.toLowerCase(),
  };
}

export function resolveTerminalCommand(input: string): TerminalRouteAction {
  const { isCommand, command } = parseTerminalCommand(input);

  if (!isCommand) {
    return { type: 'message' };
  }

  switch (command) {
    case 'coder':
    case 'plan':
      return { type: 'set-agent', agent: command };
    case 'model':
      return { type: 'show-model-selector' };
    case 'session':
    case 'sessions':
      return { type: 'show-session-selector', mode: 'select' };
    case 'new-session':
      return { type: 'create-session' };
    case 'delete-session':
      return { type: 'show-session-selector', mode: 'delete' };
    default:
      return { type: 'unknown-command', command };
  }
}
