import { memo, useCallback } from 'react';
import { Box } from '@orchetron/storm';
import { MessageList } from './MessageList.js';
import { ProcessingIndicator } from './ProcessingIndicator.js';
import { StatusBar } from './StatusBar.js';
import { WelcomeScreen } from './WelcomeScreen.js';
import { useHandlerChat } from '../hooks/useHandlerChat.js';
import { InputArea } from './InputArea.js';

interface ChatViewProps {
  onExecuteCommand: (command: string) => void;
  onExit: () => void;
  isInputFocused?: boolean;
}

function ChatViewInternal({ onExecuteCommand, onExit, isInputFocused = true }: ChatViewProps) {
  const { messages, sendMessage, addToolApprovalResponse, status, tokenCounter } = useHandlerChat();

  const handleInputSubmit = useCallback(
    (value: string) => {
      const lower = value.toLowerCase();
      if (lower === 'exit' || lower === 'quit') {
        onExit();
        return;
      }
      sendMessage({ text: value });
    },
    [onExit, sendMessage],
  );

  const handleApprove = useCallback(
    ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) => {
      addToolApprovalResponse({ id, approved, reason });
    },
    [addToolApprovalResponse],
  );

  const showWelcome = messages.length === 0;

  return (
    <Box flexDirection="column" height="100%">
      {showWelcome && <WelcomeScreen />}
      <Box flexGrow={1}>
        <MessageList
          messages={messages}
          onApprove={handleApprove}
          isStreaming={status === 'streaming' || status === 'submitted'}
        />
      </Box>
      <ProcessingIndicator status={status} />
      <StatusBar tokenCounter={tokenCounter} />
      <InputArea
        onSubmit={handleInputSubmit}
        onExecuteCommand={onExecuteCommand}
        isFocused={isInputFocused}
      />
    </Box>
  );
}

export const ChatView = memo(ChatViewInternal);
