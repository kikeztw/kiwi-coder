import type { AgentContext } from '../types/index.js';

export interface SeparatedMessages {
  systemPrompt: string;
  chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Separates system messages from chat messages for Anthropic compatibility.
 * Anthropic doesn't allow system messages mixed with user/assistant messages.
 * All system messages are combined into a single system prompt.
 */
export function separateMessages(
  context: AgentContext,
  agentSystemPrompt: string
): SeparatedMessages {
  const systemMessages = context.messages.filter(m => m.role === 'system');
  const chatMessages = context.messages.filter(
    m => m.role === 'user' || m.role === 'assistant'
  ) as Array<{ role: 'user' | 'assistant'; content: string }>;

  // Combine agent system prompt with any system messages from context
  const fullSystemPrompt =
    systemMessages.length > 0
      ? `${agentSystemPrompt}\n\n${systemMessages.map(m => m.content).join('\n')}`
      : agentSystemPrompt;

  return {
    systemPrompt: fullSystemPrompt,
    chatMessages,
  };
}
