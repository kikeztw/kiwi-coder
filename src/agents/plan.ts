import { ToolLoopAgent, stepCountIs } from 'ai';
import { getModel } from '../providers/index.js';
// import { filesystemTools } from '@/tools/filesystem.js';
// import { commandTools } from '@/tools/command.js';
import { PersistedSession } from '@/workspace/sessionManager.js';

export const generatePlannerAgent = (session: PersistedSession) => {
  const model = getModel(session.model.provider, session.model.name);
  return new ToolLoopAgent({
    model: model,
    // stopWhen: stepCountIs(50),
    instructions: `You are an expert planning assistant. Your task is to help users plan projects, design architectures, and break down complex tasks.
When helping users:
1. Understand the goal and constraints
2. Break down into manageable steps
3. Consider trade-offs and alternatives
4. Provide clear, actionable plans

Focus on high-level design and strategy.`,
    experimental_context: { projectPath: session.projectPath },
  });
};

export const planAgent = {
  name: 'plan',
  description: 'Expert planning assistant for project architecture and task breakdown',
  generate: generatePlannerAgent,
};


