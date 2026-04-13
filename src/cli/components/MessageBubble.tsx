import { memo } from 'react';
import { Box, Text } from 'ink';
import { bubbleTheme } from '../theme/colors.js';
import type { UIMessage } from 'ai';
import { ApprovalDialog } from './ApprovalDialog.js';

interface MessageProps {
  message: UIMessage;
}

const paddingX = 1;
const paddingY = 2;

const isApprovalRequested = (part: UIMessage['parts'][0]): boolean =>
  part.type.startsWith('tool-') && 'state' in part && part.state === 'approval-requested';

export const MessageBubble = memo<MessageProps>(({ message }) => {
  const { role, parts } = message;

  if(role === 'user'){
    return (
      <Box flexDirection="column">
        {parts.map((part, index) => {
          if(part.type === 'text') {
            return (
              <Box 
                key={index}
                marginBottom={0}
                paddingX={paddingX}
                paddingY={paddingY}
                alignItems="flex-start"
              >
                <Text color={bubbleTheme.user.text} bold>
                  {bubbleTheme.user.icon} 
                </Text>
                <Text color={bubbleTheme.user.text}>
                  {part.text}
                </Text>
              </Box>
            );
          }
          return null;
        })}
      </Box>
    );
  }

  if(role === 'assistant'){
    const pendingApprovalIds = parts
      .filter(isApprovalRequested)
      .map(p => ('toolCallId' in p ? p.toolCallId : ''));

    return (
      <Box flexDirection="column">
        {parts.map((part, index) => {
          if(part.type === 'text') {
            return (
              <Box 
                key={index}
                marginBottom={0}
                paddingX={paddingX}
                paddingY={paddingY}
                alignItems="flex-start"
              >
                <Text color={bubbleTheme.agent.text} bold>
                  {bubbleTheme.agent.icon} 
                </Text>
                <Text color={bubbleTheme.agent.text}>
                  {part.text}
                </Text>
              </Box>
            );
          }

          if(isApprovalRequested(part) && 'toolCallId' in part) {
            const command = (part.input as { command?: string })?.command ?? '';
            const description = (part.input as { description?: string })?.description;
            const approvalId = ('approval' in part && part.approval && 'id' in part.approval)
              ? (part.approval as { id: string }).id
              : part.toolCallId;
            const isActive = pendingApprovalIds[0] === part.toolCallId;
            return (
              <ApprovalDialog
                key={part.toolCallId}
                command={command}
                description={description}
                isActive={isActive}
                onApprove={(approved) => {}}
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

// Keep MessageComponent as alias for backward compatibility
export const MessageComponent = MessageBubble;
