import type { ModelMessage, Tool } from 'ai';

export interface Agent {
  name: string;
  description: string;
  systemPrompt: string;
  tools?: Record<string, Tool>;
  process(message: string, context: AgentContext): Promise<ModelMessage[]>;
}

export interface AgentContext {
  messages: ModelMessage[];
  sessionId: string;
  modelProvider: string;
  modelName: string;
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
