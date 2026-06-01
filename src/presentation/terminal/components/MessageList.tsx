import { memo } from 'react';
import { Box, useTerminal, ScrollView } from '@orchetron/storm';
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
    <Box flexDirection="column" width={width} flexGrow={1}>
      <ScrollView flex={1} stickToBottom scrollbarThumbColor="#82AAFF">
        {messages.map((message, index) => (
          <MessageBubble
            message={message}
            onApprove={onApprove}
            isStreaming={isStreaming && index === messages.length - 1}
          />
        ))}
      </ScrollView>
    </Box>
  );
}

export const MessageList = memo(MessageListInternal);
