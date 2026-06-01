import { ToolLoopAgent, stepCountIs } from 'ai';
import { getModel } from '../../providers/index.js';
import { filesystemTools, terminalTools, gitTools } from '@/tools/index.js';
import { CODER_PROMPT } from './prompt.js';
import type { AgentRuntimeSession, TokenUsage } from '../../application/index.js';

export type CoderAgentCallbacks = {
  onOrchestratorStep?: (usage: TokenUsage) => void;
};

export const generateCoderAgent = (session: AgentRuntimeSession, callbacks?: CoderAgentCallbacks) => {
  const model = getModel(session.model.provider, session.model.name);
  return new ToolLoopAgent({
    model: model,
    stopWhen: stepCountIs(50),
    instructions: CODER_PROMPT,
    tools: { ...filesystemTools, ...terminalTools, ...gitTools },
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

export const coderAgent = {
  name: 'coder',
  description: 'Expert coding assistant for writing, reading, and modifying code files',
  generate: generateCoderAgent,
};
