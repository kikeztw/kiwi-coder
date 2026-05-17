import { memo } from 'react';
import { Box } from 'ink';
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
}

function MessageListInternal({ messages, onApprove }: MessageListProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onApprove={onApprove}
        />
      ))}
    </Box>
  );
}

export const MessageList = memo(MessageListInternal);
