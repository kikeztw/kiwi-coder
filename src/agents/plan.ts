import { generateText, ModelMessage } from 'ai';
import type { Agent, AgentContext } from '../types/index.js';
import { getModel } from '../providers/index.js';
import { separateMessages } from './utils.js';

export class PlanAgent implements Agent {
  public readonly name = 'plan';
  public readonly description = 'Agent specialized in planning and architecture tasks';
  public readonly systemPrompt = `You are an expert planning assistant. Your task is to help users plan projects, design architectures, and break down complex tasks.

When helping users:
1. Understand the goal and constraints
2. Break down into manageable steps
3. Consider trade-offs and alternatives
4. Provide clear, actionable plans

Focus on high-level design and strategy.`;

  async process({message, context, onStep}: {message: string, context: AgentContext, onStep?: (messages: ModelMessage[]) => void}): Promise<ModelMessage[]> {
    try {
      const model = getModel(context.modelProvider, context.modelName);

      // const result = await generateText({
      //   model,
      //   system: this.systemPrompt,
      //   tools: { ...filesystemTools },
      //   stopWhen: stepCountIs(10),
      //   messages: [...context.messages, ...(await convertToModelMessages([{ parts: [{ type: 'text', text: message }], role: 'user' }]))],
      //   experimental_context: { projectPath: context.projectPath },
      // });

      // return result.response.messages;
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return [{ role: 'assistant', content: `\n[Error: ${errorMessage}]` }] as ModelMessage[];
    }
  }
}

// Export singleton instance for backward compatibility
export const planAgent: Agent = new PlanAgent();
