import { ToolLoopAgent, tool, LanguageModel } from 'ai';
import { z } from 'zod';
import { readTextFile, readMultipleFiles } from '../../../../tools/filesystem.js';
import { CONTEXTUALIZATION_PROMPT } from './prompt.js';

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
    description: 'Invokes the Contextualization Subagent to explore the existing codebase and build a clear map of how the system relates to the feature described in the Comprehension Document. Use this tool when you need to understand the current state of the codebase before proceeding with solution design. The subagent reads files, identifies relevant modules, entities, services, integration points, and documents patterns and risks. Provide the COMPREHENSION DOCUMENT as input. The output is a structured Context Map with sections: Relevant Modules and Files, Entities and Data Structures, Services and Business Logic, Integration Points, Existing Patterns and Conventions, Risks and Side Effects, and Gaps and Uncertainties. Do not use this tool if the Comprehension Document is empty or nonsensical — in that case, ask the user for clarification first.',
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
