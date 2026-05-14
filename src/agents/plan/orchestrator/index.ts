import { ToolLoopAgent } from 'ai';
import { PersistedSession } from '@/workspace/sessionManager.js';

import { getModel } from '../../../providers/index.js';
import { generateComprehensionAgent } from '../comprehension/index.js';
import { generateContextualizationAgent } from '../contextualization/index.js';
import { generateSolutionDesignAgent } from '../solution-design/index.js';
import { PLANNER_PROMPT } from './prompt.js';
import type { TokenUsage } from '../../../cli/hooks/useTokenCounter.js';

export type PlannerAgentCallbacks = {
  onSubAgentUsage?: (usage: TokenUsage) => void;
  onOrchestratorStep?: (usage: TokenUsage) => void;
};

export const generatePlannerAgent = (session: PersistedSession, callbacks?: PlannerAgentCallbacks) => {
  const model = getModel(session.model.provider, session.model.name);
  const { agentTool: comprehensionAgentTool } = generateComprehensionAgent(model, callbacks?.onSubAgentUsage);
  const { agentTool: contextualizationAgentTool } = generateContextualizationAgent(model, session.projectPath, callbacks?.onSubAgentUsage);
  const { agentTool: solutionDesignAgentTool } = generateSolutionDesignAgent(model, session.projectPath, callbacks?.onSubAgentUsage);
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
    onStepFinish: callbacks?.onOrchestratorStep ? ({ usage }) => {
      callbacks.onOrchestratorStep!({
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        totalTokens: usage?.totalTokens ?? 0,
      });
    } : undefined,
  });
};

export const planAgent = {
  name: 'plan',
  description: 'Expert planning assistant for project architecture and task breakdown',
  generate: generatePlannerAgent,
};
