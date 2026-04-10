import {  ModelMessage, Tool, UIMessage} from 'ai';
export interface Agent {
  name: string;
  description: string;
  systemPrompt: string;
  tools?: Record<string, Tool>;
  process(params: {
    messages: UIMessage[];
    session: AgentContext;
    onStep?: (chunk: UIMessage) => void,
    onToolCallStart?: (toolCall: any) => void,
    onToolCallFinish?: (toolCall: any) => void,
  }): Promise<void>;
}

export interface AgentContext {
  sessionId: string;
  modelProvider: string;
  modelName: string;
  projectPath: string;
}

export interface CommandHandler {
  name: string;
  description: string;
  execute(args: string[], context: CommandContext): Promise<string> | AsyncIterable<string>;
}

export interface CommandContext {
  currentAgent: string;
  modelProvider: string;
  modelName: string;
  messages: ModelMessage[];
  sessionId: string;
}

export interface RouterResult {
  type: 'agent' | 'command' | 'message';
  agent?: string;
  response?: string | AsyncIterable<string>;
}
