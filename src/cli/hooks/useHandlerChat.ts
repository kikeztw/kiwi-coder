import { useChat } from '@ai-sdk/react';
import { DirectChatTransport, InferAgentUIMessage } from 'ai';
import { generateCoderAgent, generatePlannerAgent } from '@/agents';
import { useSessionContext } from '../context/SessionContext';
import { loadMessages, saveMessages } from '@/workspace/sessionManager.js';
import { useEffect, useMemo, useRef } from 'react';
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import type { UIMessage } from 'ai';
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
const EMPTY_MESSAGES: UIMessage[] = [];

export const useHandlerChat = (): UseHandlerChatReturn => {
  const { currentSession, currentAgent, projectPath } = useSessionContext();
  const { tokenCounter, addOrchestratorUsage, addSubAgentUsage } = useTokenCounter();

  const sessionId = currentSession?.id ?? null;

  // Memoize agents per session so transports stay stable across renders.
  const coderAgent = useMemo(
    () =>
      currentSession
        ? generateCoderAgent(currentSession, { onOrchestratorStep: addOrchestratorUsage })
        : null,
    [sessionId, addOrchestratorUsage],
  );

  const planAgent = useMemo(
    () =>
      currentSession
        ? generatePlannerAgent(currentSession, {
            onOrchestratorStep: addOrchestratorUsage,
            onSubAgentUsage: addSubAgentUsage,
          })
        : null,
    [sessionId, addOrchestratorUsage, addSubAgentUsage],
  );

  // Memoize transports so useChat does not see a new reference every render.
  const coderTransport = useMemo(
    () => (coderAgent ? new DirectChatTransport({ agent: coderAgent }) : undefined),
    [coderAgent],
  );

  const planTransport = useMemo(
    () => (planAgent ? new DirectChatTransport({ agent: planAgent }) : undefined),
    [planAgent],
  );

  // Load messages once per session id change.
  const initialMessages = useMemo<UIMessage[]>(
    () => (sessionId ? loadMessages(projectPath, sessionId) : EMPTY_MESSAGES),
    [sessionId, projectPath],
  );

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

  // Persist messages once the active chat returns to a ready state.
  // A ref skips the first effect tick so we don't rewrite the just-loaded history.
  const persistedRef = useRef<unknown>(null);
  useEffect(() => {
    if (!sessionId) return;
    if (chat.status !== 'ready') return;
    if (chat.messages.length === 0) return;
    if (persistedRef.current === chat.messages) return;
    // Skip the very first run where messages === initialMessages (no diff yet).
    if (persistedRef.current === null && chat.messages === initialMessages) {
      persistedRef.current = chat.messages;
      return;
    }
    saveMessages(projectPath, sessionId, chat.messages as UIMessage[]);
    persistedRef.current = chat.messages;
  }, [chat.messages, chat.status, sessionId, projectPath, initialMessages]);

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
