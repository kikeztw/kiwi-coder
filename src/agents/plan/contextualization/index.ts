import { ToolLoopAgent, tool, LanguageModel } from 'ai';
import { z } from 'zod';
import { readTextFile, readMultipleFiles } from '../../../tools/filesystem.js';
import { CONTEXTUALIZATION_PROMPT, CONTEXTUALIZATION_TOOL_DESCRIPTION } from './prompt.js';
import type { TokenUsage } from '../../../cli/hooks/useTokenCounter.js';

export const generateContextualizationAgent = (model: LanguageModel, projectPath: string, onUsage?: (usage: TokenUsage) => void) => {
  const agent = new ToolLoopAgent({
    model,
    tools: {
      readTextFile,
      readMultipleFiles,
    },
    experimental_context: { projectPath: projectPath },
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
      if (onUsage && result.usage) {
        onUsage({
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
          totalTokens: result.usage.totalTokens ?? 0,
        });
      }
      return result.text;
    }
  });

  return { agent, agentTool };
};
