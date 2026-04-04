import type { RouterResult, CommandContext } from '../types/index.js';

export function parseCommand(input: string): { isCommand: boolean; command: string; args: string[] } {
  if (!input.startsWith('/')) {
    return { isCommand: false, command: '', args: [] };
  }
  
  const parts = input.slice(1).split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  return { isCommand: true, command, args };
}

export async function routeCommand(
  input: string,
  context: CommandContext,
  handlers: Map<string, (args: string[], ctx: CommandContext) => Promise<string> | AsyncIterable<string>>
): Promise<RouterResult> {
  const { isCommand, command, args } = parseCommand(input);
  
  if (!isCommand) {
    // Regular message - route to current agent
    return {
      type: 'message',
      agent: context.currentAgent,
    };
  }
  
  // Check for special commands
  if (command === 'exit' || command === 'quit') {
    process.stdout.write('\x1Bc');
    process.exit(0);
  }
  
  // Check if handler exists
  const handler = handlers.get(command);
  if (handler) {
    const result = await handler(args, context);
    return {
      type: 'command',
      response: result,
    };
  }
  
  // Unknown command
  return {
    type: 'command',
    response: `Unknown command: /${command}. Type /help for available commands.`,
  };
}
