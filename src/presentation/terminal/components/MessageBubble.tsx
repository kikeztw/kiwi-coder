import { memo, useCallback } from 'react';
import {
  MessageBubble as StormMessageBubble,
  ApprovalPrompt,
  StreamingText,
  OperationTree,
  Box,
} from '@orchetron/storm';
import type { ChatRequestOptions, UIMessage } from 'ai';
import { isToolUIPart } from 'ai';

interface ApprovalResponse {
  id: string;
  approved: boolean;
  reason?: string;
  options?: ChatRequestOptions;
}

interface MessageProps {
  message: UIMessage;
  onApprove?: (response: ApprovalResponse) => void;
  isStreaming?: boolean;
}

interface ApprovalPartProps {
  approvalId: string;
  title: string;
  onApprove?: (response: ApprovalResponse) => void;
}

function ApprovalPart({ approvalId, title, onApprove }: ApprovalPartProps) {
  const handleApprove = useCallback(
    (approved: boolean) => {
      onApprove?.({ id: approvalId, reason: 'User has approved the action', approved });
    },
    [onApprove, approvalId],
  );

  return (
    <ApprovalPrompt
      tool={title}
      options={[
        { key: 'y', label: 'approve', color: '#00FF00' },
        { key: 'n', label: 'reject', color: '#FF4444' },
      ]}
      onSelect={(key) => handleApprove(key === 'y')}
    />
  );
}

function getToolStatus(state: string): 'running' | 'completed' | 'failed' | 'pending' {
  switch (state) {
    case 'input-streaming':
    case 'output-streaming':
      return 'running';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

export const MessageBubble = memo<MessageProps>(({ message, onApprove, isStreaming }) => {
  const { role, parts, id } = message;

  if (role === 'user') {
    return (
      <Box marginTop={1} marginBottom={1}>
        {parts.map((part, index) => (
          <StormMessageBubble key={`${id}-${index}`} role={role}>
            {part.type === 'text' ? part.text : null}
          </StormMessageBubble>
        ))}
      </Box>
    );
  }

  if (role === 'assistant') {
    return (
      <>
        {parts.map((part, index) => {
          if (part.type === 'reasoning') {
            return (
              <Box key={`${part.type}-${id}-${index}`} marginTop={1} marginBottom={1}>
                <StormMessageBubble
                  role={role}
                  symbol="🧠"
                  symbolColor="#9B59B6"
                >
                  <StreamingText text={part.text} streaming={false} cursor={false} />
                </StormMessageBubble>
              </Box>
            );
          }

          if (part.type === 'text') {
            const isLastPart = index === parts.length - 1;
            const textIsStreaming = Boolean(isStreaming && isLastPart);

            if (textIsStreaming) {
              return (
                <Box key={`${part.type}-${id}-${index}`} marginTop={1} marginBottom={1}>
                  <StormMessageBubble role={role}>
                    <StreamingText text={part.text} streaming={true} />
                  </StormMessageBubble>
                </Box>
              );
            }

            return (
              <Box key={`${part.type}-${id}-${index}`} marginTop={1} marginBottom={1}>
                <StormMessageBubble role={role}>
                  {part.text}
                </StormMessageBubble>
              </Box>
            );
          }

          if (isToolUIPart(part)) {
            if (part.state === 'approval-requested') {
              return (
                <Box key={`${part.toolCallId}-${id}-${index}`} marginTop={1} marginBottom={1}>
                  <ApprovalPart
                    approvalId={part.approval.id}
                    title={part.title || 'Unknown tool'}
                    onApprove={onApprove}
                  />
                </Box>
              );
            }

            return (
              <Box key={`${part.toolCallId}-${id}-${index}`} marginTop={1} marginBottom={1}>
                <OperationTree
                  nodes={[{
                    id: part.toolCallId,
                    label: part.title || 'Tool call',
                    status: getToolStatus(part.state),
                  }]}
                />
              </Box>
            );
          }

          return null;
        })}
      </>
    );
  }

  return null;
});

export const MessageComponent = MessageBubble;
