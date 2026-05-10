import { ToolLoopAgent } from 'ai';
import { getModel } from '../../providers/index.js';
import { PersistedSession } from '@/workspace/sessionManager.js';
import { generateComprehensionAgent } from './sub-agents/comprehension/index.js';
import { generateContextualizationAgent } from './sub-agents/contextualization/index.js';
import { generateSolutionDesignAgent } from './sub-agents/solution-design/index.js';
import { PLANNER_PROMPT } from './prompt.js';

export const generatePlannerAgent = (session: PersistedSession) => {
  const model = getModel(session.model.provider, session.model.name);
  const { agentTool: comprehensionAgentTool } = generateComprehensionAgent(model);
  const { agentTool: contextualizationAgentTool } = generateContextualizationAgent(model);
  const { agentTool: solutionDesignAgentTool } = generateSolutionDesignAgent(model);
  return new ToolLoopAgent({
    model: model,
    // stopWhen: stepCountIs(50),
    instructions: PLANNER_PROMPT,
    tools:{
      comprehensionAgentTool,
      contextualizationAgentTool,
      solutionDesignAgentTool,
    },
    experimental_context: { projectPath: session.projectPath },
  });
};

export const planAgent = {
  name: 'plan',
  description: 'Expert planning assistant for project architecture and task breakdown',
  generate: generatePlannerAgent,
};

