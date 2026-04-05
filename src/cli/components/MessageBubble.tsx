import { memo } from 'react';
import { Box, Text } from 'ink';
import { bubbleTheme } from '../theme/colors.js';
import type { Message } from '../hooks/useMessages.js';

interface MessageProps {
  message: Message;
}

const paddingX = 1;
const paddingY = 2;

export const MessageBubble = memo(function MessageBubble({ message }: MessageProps) {
  const { role, content, metadata } = message;
  switch (role) {
    case 'user':
      return (
        <Box 
          marginBottom={0}
          paddingX={paddingX}
          paddingY={paddingY}
          alignItems="center"
        >
          <Text color={bubbleTheme.user.text} bold>
            {bubbleTheme.user.icon} 
          </Text>
          <Text color={bubbleTheme.user.text}>
            {content}
          </Text>
        </Box>
      );

    case 'agent':
      return (
        <Box 
          marginBottom={0}
          paddingX={paddingX}
          paddingY={paddingY}
          alignItems="center"
        >
          <Text color={bubbleTheme.agent.text} bold>
            {bubbleTheme.agent.icon} 
          </Text>
          <Text color={bubbleTheme.agent.text}>
            {content}
          </Text>
        </Box>
      );

    case 'tool':
      return (
        <Box 
          marginBottom={0}
          paddingX={paddingX}
          paddingY={paddingY}
          alignItems="center"
        >
          <Text color={bubbleTheme.tool.text} bold>
            {bubbleTheme.tool.icon} {metadata?.toolName || 'Tool'}
          </Text>
          {metadata?.toolArgs && (
            <Text color={bubbleTheme.system.text} dimColor>
              {JSON.stringify(metadata.toolArgs, null, 2)}
            </Text>
          )}
          <Text color={bubbleTheme.tool.text}>
            {content}
          </Text>
        </Box>
      );

    case 'system':
      return (
        <Box 
          marginBottom={0}
          paddingX={paddingX}
          >
          <Text color={bubbleTheme.system.text} dimColor>
            {bubbleTheme.system.icon} {content}
          </Text>
        </Box>
      );

    case 'debug':
      return (
        <Box 
          marginBottom={0}
          paddingX={paddingX}
        >
          <Text color="gray" dimColor>
            🐛 {content}
          </Text>
        </Box>
      );

    default:
      return (
        <Box 
          marginBottom={0}
          paddingX={paddingX}
          paddingY={paddingY}
        >
          <Text>{content}</Text>
        </Box>
      );
  }
});

// Keep MessageComponent as alias for backward compatibility
export const MessageComponent = MessageBubble;
