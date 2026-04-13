import { ToolLoopAgent, stepCountIs } from 'ai';
import { getModel } from '../providers/index.js';
import { filesystemTools } from '@/tools/filesystem.js';
import { commandTools } from '@/tools/command.js';
import { PersistedSession } from '@/workspace/sessionManager.js';

export const generateCoderAgent = (session: PersistedSession) => {
  const model = getModel(session.model.provider, session.model.name);
  return new ToolLoopAgent({
    model: model,
    stopWhen: stepCountIs(50),
    instructions: `You are an expert coding assistant. Your task is to help users write, read, and modify code files.
When helping users:
1. First understand the existing code by reading relevant files
2. Think step by step about the changes needed
3. Use the tools to implement the solution
4. Verify the changes work correctly

When a tool execution is not approved by the user, do not retry it.
Always operate within the workspace directory for security.`,
    tools: { ...filesystemTools, ...commandTools },
    experimental_context: { projectPath: session.projectPath },
  });
};

export const coderAgent = {
  name: 'coder',
  description: 'Expert coding assistant for writing, reading, and modifying code files',
  generate: generateCoderAgent,
};


