import { memo } from 'react';
import { ScrollView, Box, useTerminal } from '@orchetron/storm';
import type { ChatRequestOptions, UIMessage } from 'ai';
import { MessageBubble } from './MessageBubble.js';

interface ApprovalResponse {
  id: string;
  approved: boolean;
  reason?: string;
  options?: ChatRequestOptions;
}

interface MessageListProps {
  messages: UIMessage[];
  onApprove: (response: ApprovalResponse) => void;
  isStreaming?: boolean;
}

function MessageListInternal({ messages, onApprove, isStreaming }: MessageListProps) {
  const { width } = useTerminal();

  return (
    <Box flex={1} flexDirection="column" overflow="hidden" width={width}>
      <ScrollView flex={1} scrollSpeed={1} stickToBottom>
        <Box flexDirection="column" gap={2} width={width} overflow="hidden">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              onApprove={onApprove}
              isStreaming={isStreaming && index === messages.length - 1}
              terminalWidth={width}
            />
          ))}
        </Box>
      </ScrollView>
    </Box>
  );
}

export const MessageList = memo(MessageListInternal);
