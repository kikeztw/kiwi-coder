import { ToolLoopAgent, tool, LanguageModel } from 'ai';
import { z } from 'zod';
import { writeFile } from '../../../tools/filesystem.js';
import { SOLUTION_DESIGN_PROMPT } from './prompt.js';

export const generateSolutionDesignAgent = (model: LanguageModel) => {
  const agent = new ToolLoopAgent({
    model,
    tools: {
      writeFile,
    },
    instructions: SOLUTION_DESIGN_PROMPT,
  });

  const agentTool = tool({
    title: 'Solution Design Agent',
    description: 'Invokes the Design Solution Subagent to produce a clear, actionable technical implementation plan. Use this tool when you need to generate a detailed plan for implementing a feature. Provide the COMPREHENSION DOCUMENT and CONTEXT MAP as inputs. The subagent will create a markdown file at .kiwi/plan/PLAN_[FEATURE_NAME].md with sections covering Feature Summary, Core Technical Challenge, Approaches Considered, Selected Approach, Implementation Steps, Files and Modules Affected, Technical Considerations, Acceptance Criteria Coverage, and Open Risks and Warnings. Do not use this tool if either input is missing or nonsensical — in that case, ask the user for clarification first.',
    inputSchema: z.object({
      comprehensionDocument: z.string().describe('The structured comprehension document from the Comprehension Subagent'),
      contextMap: z.string().describe('The structured context map from the Contextualization Subagent'),
    }),
    execute: async ({ comprehensionDocument, contextMap }, { abortSignal }) => {
      const result = await agent.generate({
        prompt: `${comprehensionDocument}\n\n${contextMap}`,
        abortSignal
      });
      return result.text;
    }
  });

  return { agent, agentTool };
};
