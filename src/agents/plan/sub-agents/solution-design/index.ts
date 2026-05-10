import { ToolLoopAgent, tool, LanguageModel } from 'ai';
import { z } from 'zod';
import { writeFile, editFile, createDirectory, readTextFile} from '../../../../tools/filesystem.js';
import { SOLUTION_DESIGN_PROMPT, SOLUTION_DESIGN_TOOL_DESCRIPTION } from './prompt.js';

export const generateSolutionDesignAgent = (model: LanguageModel, projectPath: string) => {
  const agent = new ToolLoopAgent({
    model,
    tools: {
      writeFile,
      editFile,
      readTextFile,
      createDirectory,
    },
    experimental_context: { projectPath: projectPath },
    instructions: SOLUTION_DESIGN_PROMPT,
  });

  const agentTool = tool({
    title: 'Solution Design Agent',
    description: SOLUTION_DESIGN_TOOL_DESCRIPTION,
    inputSchema: z.object({
      comprehensionDocument: z.string().describe('The structured comprehension document from the Comprehension Subagent'),
      contextMap: z.string().describe('The structured context map from the Contextualization Subagent'),
    }),
    execute: async ({ comprehensionDocument, contextMap }, { abortSignal }) => {
      const result = await agent.generate({
        prompt: `${comprehensionDocument}\n\n${contextMap}`,
        abortSignal,
      });
      return result.text;
    }
  });

  return { agent, agentTool };
};
