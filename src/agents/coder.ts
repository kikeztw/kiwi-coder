import { convertToModelMessages, stepCountIs, UIMessage, streamText, readUIMessageStream} from 'ai';
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

  async process(params: {
    messages: UIMessage[],
    session: AgentContext;
    onStep?: (chunk:  UIMessage) => void,
    onStart?: () => void,
    onToolCallStart?: (toolCall: any) => void,
    onToolCallFinish?: (toolCall: any) => void,
  }): Promise<void> {
    try {
      const {messages, session, onStep, onStart, onToolCallStart, onToolCallFinish} = params;
      const {projectPath} = session;
      const model = getModel(session.modelProvider, session.modelName);

      const result = streamText({
        model,
        system: this.systemPrompt,
        tools: { ...filesystemTools },
        stopWhen: stepCountIs(50),
        messages: await convertToModelMessages(messages),
        experimental_context: { projectPath },
        experimental_onStart: () => {
          onStart?.();
        },
        experimental_onToolCallStart: (toolCall) => {
          // console.log('Tool call start:', toolCall);
          onToolCallStart?.(toolCall);
        },
        experimental_onToolCallFinish: (toolCall) => {
          // console.log('Tool call finish:', toolCall);
          onToolCallFinish?.(toolCall);
        }
      });

      for await (const uiMessage of readUIMessageStream({
        stream: result.toUIMessageStream(),
      })) {
        // console.log(uiMessage);
        onStep?.(uiMessage);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Coder agent error:', errorMessage);
    }
  }
}

// Export singleton instance for backward compatibility
export const coderAgent: Agent = new CoderAgent();
