import { memo } from 'react';
import { Box, Text } from 'ink';
import { bubbleTheme } from '../theme/colors.js';
import type { ChatRequestOptions, UIMessage } from 'ai';
import { isToolUIPart } from 'ai';
import { ApprovalDialog } from './ApprovalDialog.js';
import Spinner from 'ink-spinner';


interface ApprovalResponse {
  id: string;
  approved: boolean;
  reason?: string;
  options?: ChatRequestOptions;
}

interface MessageProps {
  message: UIMessage;
  onApprove?: (response: ApprovalResponse) => void;
}

const paddingX = 1;
const paddingY = 2;

export const MessageBubble = memo<MessageProps>(({ message, onApprove }) => {
  const { role, parts } = message;

  if (role === 'user') {
    return (
      <Box flexDirection="column">
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <Box
                key={index}
                marginBottom={0}
                paddingX={paddingX}
                paddingY={paddingY}
                alignItems="flex-start"
              >
                <Text color={bubbleTheme.user.text} bold>
                  {bubbleTheme.user.icon}{' '}
                </Text>
                <Text color={bubbleTheme.user.text}>{part.text}</Text>
              </Box>
            );
          }
          return null;
        })}
      </Box>
    );
  }

  if (role === 'assistant') {
    const pendingParts = parts.filter(
      (p) => isToolUIPart(p) && p.state === 'approval-requested'
    );
    const activeToolCallId = pendingParts.length > 0 && 'toolCallId' in pendingParts[0]
      ? pendingParts[0].toolCallId
      : null;

    return (
      <Box flexDirection="column">
        {parts.map((part, index) => {

           if (part.type === 'reasoning') {
            return (
              <Box
                key={index}
                marginBottom={0}
                paddingX={paddingX}
                paddingY={paddingY}
                alignItems="flex-start"
              >
                <Text color="gray" dimColor bold>
                  🧠 Thinking: 
                </Text>
                <Text color="gray" dimColor>{part.text}</Text>
              </Box>
            );
          }

          if (part.type === 'text') {
            return (
              <Box
                key={index}
                marginBottom={0}
                paddingX={paddingX}
                paddingY={paddingY}
                alignItems="flex-start"
              >
                <Text color={bubbleTheme.agent.text} bold>
                  {bubbleTheme.agent.icon}{' '}
                </Text>
                <Text color={bubbleTheme.agent.text}>{part.text}</Text>
              </Box>
            );
          }

          if(isToolUIPart(part) && part.state === 'input-streaming'){
            return (
              <Box
                key={index}
                marginBottom={0}
                paddingX={paddingX}
                paddingY={paddingY}
                alignItems="flex-start"
              >
                <Spinner type="dots" />
                <Text color={bubbleTheme.agent.text}>{`Executing ${part.title}...`}</Text>
              </Box>
            );
          }

          if (isToolUIPart(part) && part.state === 'approval-requested') {
            const command = (part.input as { command?: string })?.command ?? '';
            const description = (part.input as { description?: string })?.description;
            const isActive = part.toolCallId === activeToolCallId;

            return (
              <ApprovalDialog
                key={part.toolCallId}
                command={command}
                description={description}
                isActive={isActive}
                onApprove={(approved) =>{
                  onApprove?.({ id: part.approval.id, reason: 'User has approved the action', approved })
                }}
              />
            );
          }

          return null;
        })}
      </Box>
    );
  }

  return null;
});

export const MessageComponent = MessageBubble;
