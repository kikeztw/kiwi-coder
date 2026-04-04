import { agentRegistry } from '../agents/registry.js';
import type { CommandContext } from '../types/index.js';

export async function agentHandler(
  args: string[],
  context: CommandContext
): Promise<string> {
  const agentName = args[0];
  
  if (!agentName) {
    const current = agentRegistry.getCurrentName();
    const available = agentRegistry.list().join(', ');
    return `Current agent: ${current}\nAvailable agents: ${available}`;
  }
  
  const success = agentRegistry.setCurrent(agentName);
  if (success) {
    const agent = agentRegistry.get(agentName);
    return `Switched to ${agentName} agent\n${agent?.description || ''}`;
  }
  
  const available = agentRegistry.list().join(', ');
  return `Unknown agent: ${agentName}\nAvailable: ${available}`;
}
