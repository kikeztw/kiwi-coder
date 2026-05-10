import { ToolLoopAgent, tool, LanguageModel } from 'ai';
import { z } from 'zod';
import { COMPREHENSION_PROMPT, COMPREHENSION_TOOL_DESCRIPTION } from './prompt.js';

export const generateComprehensionAgent = (model: LanguageModel) => {
  const agent = new ToolLoopAgent({
    model,
    instructions: COMPREHENSION_PROMPT,
  });

  const agentTool = tool({
    title: 'Comprehension Agent',
    description: COMPREHENSION_TOOL_DESCRIPTION,
    inputSchema: z.object({
      ticket: z.string().describe('The feature request or user story to analyze'),
    }),
    execute: async ({ ticket }, { abortSignal }) => {
      const result = await agent.generate({
        prompt: ticket,
        abortSignal
      });
      return result.text;
    }
  });

  return { agent, agentTool };
};
