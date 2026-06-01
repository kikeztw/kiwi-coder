import { useChat } from '@ai-sdk/react';
import { DirectChatTransport, InferAgentUIMessage } from 'ai';
import { generateCoderAgent, generatePlannerAgent } from '@/agents';
import { useMemo } from 'react';
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import type { UIMessage } from 'ai';
import type { AgentRuntimeSession } from '../../../application/index.js';
import {
  usePersistedSessionMessages,
  useSessionMessageSnapshot,
} from './usePersistedSessionMessages.js';
import { useSessionContext } from '../context/index.js';
import { useTokenCounter, type TokenCounter } from './useTokenCounter.js';

export type CoderAgentUIMessage = InferAgentUIMessage<ReturnType<typeof generateCoderAgent>>;
export type PlanAgentUIMessage = InferAgentUIMessage<ReturnType<typeof generatePlannerAgent>>;
export type AgentUIMessage = CoderAgentUIMessage | PlanAgentUIMessage;

export type UseHandlerChatReturn = {
  messages: AgentUIMessage[];
  sendMessage: (message: { text: string }) => void;
  addToolApprovalResponse: (response: { id: string; approved: boolean; reason?: string }) => void;
  status: string;
  tokenCounter: TokenCounter;
};

const NO_SESSION_ID = 'no-session';

export const useHandlerChat = (): UseHandlerChatReturn => {
  const {
    currentSession,
    currentAgent,
    loadSessionMessages,
    saveSessionMessages,
  } = useSessionContext();
  const { tokenCounter, addOrchestratorUsage, addSubAgentUsage } = useTokenCounter();

  const sessionId = currentSession?.id ?? null;

  const runtimeSession = useMemo<AgentRuntimeSession | null>(
    () =>
      currentSession
        ? {
            id: currentSession.id,
            projectPath: currentSession.projectPath,
            agent: currentSession.agent,
            model: {
              id: currentSession.model.id,
              provider: currentSession.model.provider,
              name: currentSession.model.model,
              displayName: currentSession.model.name,
            },
          }
        : null,
    [currentSession],
  );

  const coderAgent = useMemo(
    () =>
      runtimeSession
        ? generateCoderAgent(runtimeSession, { onOrchestratorStep: addOrchestratorUsage })
        : null,
    [runtimeSession, addOrchestratorUsage],
  );

  const planAgent = useMemo(
    () =>
      runtimeSession
        ? generatePlannerAgent(runtimeSession, {
            onOrchestratorStep: addOrchestratorUsage,
            onSubAgentUsage: addSubAgentUsage,
          })
        : null,
    [runtimeSession, addOrchestratorUsage, addSubAgentUsage],
  );

  const coderTransport = useMemo(
    () => (coderAgent ? new DirectChatTransport({ agent: coderAgent }) : undefined),
    [coderAgent],
  );

  const planTransport = useMemo(
    () => (planAgent ? new DirectChatTransport({ agent: planAgent }) : undefined),
    [planAgent],
  );

  const initialMessages = useSessionMessageSnapshot({
    sessionId,
    loadSnapshot: loadSessionMessages,
  });

  const coderAgentChat = useChat<CoderAgentUIMessage>({
    id: sessionId ?? NO_SESSION_ID,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: initialMessages as any,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: coderTransport as any,
  });

  const planAgentChat = useChat<PlanAgentUIMessage>({
    id: sessionId ? `${sessionId}-plan` : `${NO_SESSION_ID}-plan`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: initialMessages as any,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: planTransport as any,
  });

  const chat = currentAgent === 'coder' ? coderAgentChat : planAgentChat;

  usePersistedSessionMessages({
    sessionId,
    status: chat.status,
    messages: chat.messages as UIMessage[],
    initialMessages,
    saveSnapshot: saveSessionMessages,
  });

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: chat.messages as any,
    sendMessage: chat.sendMessage,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addToolApprovalResponse: (chat as any).addToolApprovalResponse,
    status: chat.status,
    tokenCounter,
  };
};
