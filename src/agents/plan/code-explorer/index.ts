import { ToolLoopAgent, tool, LanguageModel, Output } from 'ai';
import { z } from 'zod';
import {
  readFile,
  findByName,
  grepSearch,
  listDirectory,
} from '../../../tools/filesystem/index.js';
import { CODE_EXPLORER_PROMPT, CODE_EXPLORER_TOOL_DESCRIPTION } from './prompt.js';
import { ContextSummarySchema, type ContextSummary } from '../schema.js';
import type { TokenUsage } from '../../../application/index.js';

const EMPTY_CONTEXT: ContextSummary = {
  relatedModules: [],
  affectedEntities: [],
  existingPatterns: [],
  sideEffectRisks: [],
  technicalDebt: [],
  unexploredAreas: [],
};

export const generateCodeExplorerSubagent = (
  model: LanguageModel,
  projectPath: string,
  onUsage?: (usage: TokenUsage) => void,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agent: any = new ToolLoopAgent({
    model,
    instructions: CODE_EXPLORER_PROMPT,
    tools: {
      readFile,
      findByName,
      grepSearch,
      listDirectory,
    },
    experimental_context: { projectPath },
    output: Output.object({
      schema: ContextSummarySchema,
      name: 'context_summary',
      description:
        'Structured context summary of the codebase relevant to the feature being planned.',
    }),
  });

  const agentTool = tool({
    title: 'Code Explorer Subagent',
    description: CODE_EXPLORER_TOOL_DESCRIPTION,
    inputSchema: z.object({
      comprehensionDocument: z
        .string()
        .describe(
          'Plain-text description of the feature to investigate, including what, why, actors, acceptance criteria, edge cases and ambiguities.',
        ),
    }),
    execute: async ({ comprehensionDocument }, { abortSignal }) => {
      const result = await agent.generate({
        prompt: comprehensionDocument,
        abortSignal,
      });

      if (onUsage && result.usage) {
        onUsage({
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
          totalTokens: result.usage.totalTokens ?? 0,
        });
      }

      const summary: ContextSummary = result.experimental_output ?? EMPTY_CONTEXT;
      return JSON.stringify(summary, null, 2);
    },
  });

  return { agentTool };
};
