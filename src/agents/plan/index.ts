import { ToolLoopAgent } from 'ai';
import { PersistedSession } from '@/workspace/sessionManager.js';

import { getModel } from '../../providers/index.js';
import { writeFile, createDirectory } from '../../tools/filesystem/index.js';
import { generateCodeExplorerSubagent } from './code-explorer/index.js';
import { PLANNER_PROMPT } from './prompt.js';
import type { TokenUsage } from '../../cli/hooks/useTokenCounter.js';

export type PlannerAgentCallbacks = {
  onSubAgentUsage?: (usage: TokenUsage) => void;
  onOrchestratorStep?: (usage: TokenUsage) => void;
};

export const generatePlannerAgent = (
  session: PersistedSession,
  callbacks?: PlannerAgentCallbacks,
) => {
  const model = getModel(session.model.provider, session.model.name);

  const { agentTool: codeExplorerSubagent } = generateCodeExplorerSubagent(
    model,
    session.projectPath,
    callbacks?.onSubAgentUsage,
  );

  return new ToolLoopAgent({
    model,
    instructions: PLANNER_PROMPT,
    tools: {
      codeExplorerSubagent,
      writeFile,
      createDirectory,
    },
    experimental_context: { projectPath: session.projectPath },
    onStepFinish: callbacks?.onOrchestratorStep
      ? ({ usage }) => {
          callbacks.onOrchestratorStep!({
            inputTokens: usage?.inputTokens ?? 0,
            outputTokens: usage?.outputTokens ?? 0,
            totalTokens: usage?.totalTokens ?? 0,
          });
        }
      : undefined,
  });
};

export const planAgent = {
  name: 'plan',
  description:
    'Senior software engineer planner. Delegates codebase exploration to a specialised subagent and produces a structured markdown plan in .kiwi/plan/.',
  generate: generatePlannerAgent,
};
