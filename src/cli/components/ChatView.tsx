import { memo, useCallback } from 'react';
import { Box } from 'ink';

import { MessageList } from './MessageList.js';
import { ProcessingIndicator } from './ProcessingIndicator.js';
import { StatusBar } from './StatusBar.js';
import { WelcomeScreen } from './WelcomeScreen.js';
import { InputArea } from './InputArea.js';
import { useHandlerChat } from '../hooks/useHandlerChat.js';

interface ChatViewProps {
  onSubmit: (value: string) => void;
  onExit: () => void;
}

function ChatViewInternal({ onSubmit, onExit }: ChatViewProps) {
  const { messages, sendMessage, addToolApprovalResponse, status, tokenCounter } = useHandlerChat();

  const handleInputSubmit = useCallback(
    (value: string) => {
      const lower = value.toLowerCase();
      if (lower === 'exit' || lower === 'quit') {
        onExit();
        return;
      }
      const isCommand = value.startsWith('/');
      onSubmit(value);
      if (!isCommand) {
        sendMessage({ text: value });
      }
    },
    [onSubmit, onExit, sendMessage],
  );

  const handleApprove = useCallback(
    ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) => {
      addToolApprovalResponse({ id, approved, reason });
    },
    [addToolApprovalResponse],
  );

  const showWelcome = messages.length === 0;

  return (
    <Box flexDirection="column">
      {showWelcome && <WelcomeScreen />}
      <MessageList messages={messages} onApprove={handleApprove} />
      <ProcessingIndicator status={status} />
      <StatusBar tokenCounter={tokenCounter} />
      <InputArea onSubmit={handleInputSubmit} />
    </Box>
  );
}

export const ChatView = memo(ChatViewInternal);