import { memo, useCallback } from 'react';
import { Box, useTerminal } from '@orchetron/storm';
import { MessageList } from './MessageList.js';
import { ProcessingIndicator } from './ProcessingIndicator.js';
import { StatusBar } from './StatusBar.js';
import { useHandlerChat } from '../hooks/useHandlerChat.js';
import { InputArea } from './InputArea.js';

interface ChatViewProps {
  onExit: () => void;
  isInputFocused?: boolean;
}

function ChatViewInternal({ onExit, isInputFocused = true }: ChatViewProps) {
  const { width, height } = useTerminal();
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

  return (
    <Box width={width} height={height} flexDirection="column" overflow="hidden">
      <Box flex={1} flexDirection="column" overflow="hidden">
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
        isFocused={isInputFocused}
      />
    </Box>
  );
}

export const ChatView = memo(ChatViewInternal);
