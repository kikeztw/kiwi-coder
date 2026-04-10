import { convertToModelMessages, stepCountIs, UIMessage, streamText, readUIMessageStream} from 'ai';
import type { Agent, AgentContext } from '../types/index.js';
import { getModel } from '../providers/index.js';

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

   async process(params: {
    messages: UIMessage[],
    session: AgentContext;
    onStep?: (chunk:  UIMessage) => void,
    onMessagesUpdate?: (messages: UIMessage[]) => void
  }): Promise<void> {
    try {
      const {messages, session, onStep, onMessagesUpdate} = params;
      const {projectPath} = session;
      const model = getModel(session.modelProvider, session.modelName);
      

      const result = streamText({
        model,
        system: this.systemPrompt,
        stopWhen: stepCountIs(50),
        messages: await convertToModelMessages(messages),
        experimental_context: { projectPath },
      });

      let lastUIMessage: UIMessage | null = null;
      for await (const uiMessage of readUIMessageStream({
        stream: result.toUIMessageStream(),
      })) {
        console.log(uiMessage);
        onStep?.(uiMessage);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Coder agent error:', errorMessage);
    }
  }
}

// Export singleton instance for backward compatibility
export const planAgent: Agent = new PlanAgent();
