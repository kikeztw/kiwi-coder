import { useChat } from '@ai-sdk/react';
import { DirectChatTransport } from 'ai';
import { generateCoderAgent } from '@/agents';
import { generatePlannerAgent } from '@/agents';
import { useSessionContext } from '../context/SessionContext';
import { PersistedSession, loadMessages, saveMessages } from '@/workspace/sessionManager.js';
import { useCallback, useMemo } from 'react';
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import type { UIMessage } from 'ai';


export const useHandlerChat = () => {
  const { currentSession, currentAgent, projectPath } = useSessionContext();

  // Return early if no session is available - return a disabled chat
  if (!currentSession) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return useChat({ id: 'no-session', messages: [] }) as any;
  }

  const coderAgent = useMemo(
    () => generateCoderAgent(currentSession as PersistedSession),
    [currentSession?.id],
  );
  const planAgent = useMemo(
    () => generatePlannerAgent(currentSession as PersistedSession),
    [currentSession?.id],
  );

  // Load messages once per session ID change
  const initialMessages = useMemo<UIMessage[]>(
    () => loadMessages(projectPath, currentSession.id),
    [currentSession?.id, projectPath],
  );

  const persistMessages = useCallback(
    (messages: UIMessage[]) => {
      if (currentSession) {
        saveMessages(projectPath, currentSession.id, messages);
      }
    },
    [currentSession?.id, projectPath],
  );

  const coderAgentChat = useChat({
    id: currentSession?.id,
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: new DirectChatTransport({ agent: coderAgent }) as any,
    onFinish: () => persistMessages(coderAgentChat.messages),
  });

  const planAgentChat = useChat({
    id: currentSession?.id ? `${currentSession.id}-plan` : undefined,
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: new DirectChatTransport({ agent: planAgent }) as any,
    onFinish: () => persistMessages(planAgentChat.messages),
  });

  const chat = currentAgent === 'coder' ? coderAgentChat : planAgentChat;
  return chat;
};
