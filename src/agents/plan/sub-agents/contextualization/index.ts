import { ToolLoopAgent, tool, LanguageModel } from 'ai';
import { z } from 'zod';
import { readTextFile, readMultipleFiles } from '../../../../tools/filesystem.js';
import { CONTEXTUALIZATION_PROMPT, CONTEXTUALIZATION_TOOL_DESCRIPTION } from './prompt.js';

export const generateContextualizationAgent = (model: LanguageModel) => {
  const agent = new ToolLoopAgent({
    model,
    tools: {
      readTextFile,
      readMultipleFiles,
    },
    instructions: CONTEXTUALIZATION_PROMPT,
  });

  const agentTool = tool({
    title: 'Contextualization Agent',
    description: CONTEXTUALIZATION_TOOL_DESCRIPTION,
    inputSchema: z.object({
      comprehensionDocument: z.string().describe('The structured comprehension document from the Comprehension Subagent'),
    }),
    execute: async ({ comprehensionDocument }, { abortSignal }) => {
      const result = await agent.generate({
        prompt: comprehensionDocument,
        abortSignal
      });
      return result.text;
    }
  });

  return { agent, agentTool };
};
