import { streamText } from 'ai';
import type { Agent, AgentContext } from '../types/index.js';
import { getModel } from '../providers/index.js';
import { separateMessages } from './utils.js';

export const coderAgent: Agent = {
  name: 'coder',
  description: 'Agent specialized in coding tasks',
  systemPrompt: `You are an expert coding assistant. Your task is to help users write, read, and modify code files.

When helping users:
1. First understand the existing code by reading relevant files
2. Think step by step about the changes needed
3. Use the tools to implement the solution
4. Verify the changes work correctly

Always operate within the workspace directory for security.`,

  async *process(message: string, context: AgentContext): AsyncIterable<string> {
    try {
      const model = getModel(context.modelProvider, context.modelName);
      const { systemPrompt, chatMessages } = separateMessages(context, this.systemPrompt);

      const result = streamText({
        model,
        system: systemPrompt,
        messages: [
          ...chatMessages,
          { role: 'user', content: message },
        ],
      });

      for await (const textPart of result.textStream) {
        yield textPart;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      yield `\n[Error: ${errorMessage}]`;
    }
  },
};
