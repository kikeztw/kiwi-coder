import { generateText } from 'ai';
import type { Agent, AgentContext } from '../types/index.js';
import { getModel } from '../providers/index.js';
import { separateMessages } from './utils.js';

export const planAgent: Agent = {
  name: 'plan',
  description: 'Agent specialized in planning and architecture tasks',
  systemPrompt: `You are an expert planning assistant. Your task is to help users plan projects, design architectures, and break down complex tasks.

When helping users:
1. Understand the goal and constraints
2. Break down into manageable steps
3. Consider trade-offs and alternatives
4. Provide clear, actionable plans

Focus on high-level design and strategy.`,

  async *process(message: string, context: AgentContext): AsyncIterable<string> {
    try {
      const model = getModel(context.modelProvider, context.modelName);
      const { systemPrompt, chatMessages } = separateMessages(context, this.systemPrompt);

      const result = await generateText({
        model,
        system: systemPrompt,
        messages: [
          ...chatMessages,
          { role: 'user', content: message },
        ],
      });

      yield result.text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      yield `\n[Error: ${errorMessage}]`;
    }
  },
};
