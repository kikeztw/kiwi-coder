import { ToolLoopAgent, tool, LanguageModel } from 'ai';
import { z } from 'zod';
import { COMPREHENSION_PROMPT } from './prompt.js';

export const generateComprehensionAgent = (model: LanguageModel) => {
  const agent = new ToolLoopAgent({
    model,
    instructions: COMPREHENSION_PROMPT,
  });

  const agentTool = tool({
    title: 'Comprehension Agent',
    description: 'Invokes the Comprehension Subagent to analyze a feature request and produce a structured understanding document. Use this tool when you need to deeply understand a user story or ticket before proceeding with contextualization or solution design. The subagent extracts the core functionality, business value, actors, acceptance criteria, edge cases, and ambiguities from the ticket. Provide the TICKET (feature description) and RESTRICTIONS (any known constraints) as inputs. The output is a JSON document with structured fields: what, why, actors, acceptance_criteria, edge_cases, detected_ambiguities, and self_evaluation. Do not use this tool if the ticket is completely empty or nonsensical — in that case, ask the user for clarification first.',
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
