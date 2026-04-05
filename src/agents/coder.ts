import { generateText, ModelMessage, convertToModelMessages, stepCountIs} from 'ai';
import type { Agent, AgentContext } from '../types/index.js';
import { getModel } from '../providers/index.js';
import { filesystemTools } from '@/tools/filesystem.js';

export class CoderAgent implements Agent {

  public readonly name = 'coder';
  public readonly description = 'Agent specialized in coding tasks';
  public readonly systemPrompt = `You are an expert coding assistant. Your task is to help users write, read, and modify code files.

When helping users:
1. First understand the existing code by reading relevant files
2. Think step by step about the changes needed
3. Use the tools to implement the solution
4. Verify the changes work correctly

Always operate within the workspace directory for security.`;

  async process({message, context, onStep}: {message: string, context: AgentContext, onStep?: (messages: ModelMessage[]) => void}): Promise<ModelMessage[]> {
    try {
      const model = getModel(context.modelProvider, context.modelName);
      const allMessages: ModelMessage[] = [];

      await generateText({
        model,
        system: this.systemPrompt,
        tools: { ...filesystemTools },
        stopWhen: stepCountIs(20),
        messages: [...context.messages, ...(await convertToModelMessages([{ parts: [{ type: 'text', text: message }], role: 'user' }]))],
        experimental_context: { projectPath: context.projectPath },
        onStepFinish: (step) => {
          const stepMessages = step.response.messages as ModelMessage[];
          // console.log('stepMessages', JSON.stringify(stepMessages, null, 2));
          if (onStep) {
            onStep(stepMessages);
          }
        }
      });

      return allMessages;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return [{ role: 'assistant', content: `\n[Error: ${errorMessage}]` }] as ModelMessage[];
    }
  }
}

// Export singleton instance for backward compatibility
export const coderAgent: Agent = new CoderAgent();
