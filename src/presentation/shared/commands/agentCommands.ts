import type { AgentMode } from '../session/index.js';

export type AgentCommandResult =
  | { type: 'message' }
  | { type: 'set-agent'; agent: AgentMode }
  | { type: 'show-provider-selector' }
  | { type: 'unknown-command'; command: string };

export function resolveAgentCommand(input: string): AgentCommandResult {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return { type: 'message' };
  }

  const [command = ''] = trimmed.slice(1).split(/\s+/);
  switch (command.toLowerCase()) {
    case 'coder':
      return { type: 'set-agent', agent: 'coder' };
    case 'plan':
      return { type: 'set-agent', agent: 'plan' };
    case 'model':
      return { type: 'show-provider-selector' };
    default:
      return { type: 'unknown-command', command: command.toLowerCase() };
  }
}
