import { useChat } from '@ai-sdk/react';
import { DirectChatTransport } from 'ai';
import { generateCoderAgent } from '@/agents';
import { generatePlannerAgent } from '@/agents';
import { useSessionContext } from '../context/SessionContext';
import { PersistedSession } from '@/workspace/sessionManager.js';
import { useMemo } from 'react';
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';


export const useHandlerChat = () => {
  const { currentSession, currentAgent } = useSessionContext();
  // console.log(currentAgent);
  // console.log(currentSession);
  const coderAgent = useMemo(() => generateCoderAgent(currentSession as PersistedSession), [currentSession]);
  const planAgent = useMemo(() => generatePlannerAgent(currentSession as PersistedSession), [currentSession]);

  const coderAgentChat = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    transport: new DirectChatTransport({
      agent: coderAgent,
    }),
  });

  const planAgentChat = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    transport: new DirectChatTransport({
      agent: planAgent,
    }),
  });

  const chat = currentAgent === 'coder' ? coderAgentChat : planAgentChat;
  return chat;
};
