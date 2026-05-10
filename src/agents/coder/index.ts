import { ToolLoopAgent, stepCountIs } from 'ai';
import { getModel } from '../../providers/index.js';
import { filesystemTools } from '@/tools/filesystem.js';
import { commandTools } from '@/tools/command.js';
import { PersistedSession } from '@/workspace/sessionManager.js';
import { CODER_PROMPT } from './prompt.js';

export const generateCoderAgent = (session: PersistedSession) => {
  const model = getModel(session.model.provider, session.model.name);
  return new ToolLoopAgent({
    model: model,
    stopWhen: stepCountIs(50),
    instructions: CODER_PROMPT,
    tools: { ...filesystemTools, ...commandTools },
    experimental_context: { projectPath: session.projectPath },
  });
};

export const coderAgent = {
  name: 'coder',
  description: 'Expert coding assistant for writing, reading, and modifying code files',
  generate: generateCoderAgent,
};
