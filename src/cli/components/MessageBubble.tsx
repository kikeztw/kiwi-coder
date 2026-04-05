import { memo } from 'react';
import { Box, Text } from 'ink';
import { ModelMessage } from 'ai';
import { bubbleTheme } from '../theme/colors.js';

interface MessageProps {
  message: ModelMessage;
}

const paddingX = 1;
const paddingY = 2;

// Helper to extract text content from ModelMessage (handles string or array of parts)
function getTextContent(content: ModelMessage['content']): string {
  if (typeof content === 'string') {
    return content;
  }
  // Handle array of parts (TextPart, ImagePart, etc.)
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          return (part as { text: string }).text;
        }
        return JSON.stringify(part);
      })
      .join('');
  }
  return JSON.stringify(content);
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageProps) {
  const { role, content } = message;
  const textContent = getTextContent(content);

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
            {textContent}
          </Text>
        </Box>
      );

    case 'assistant':
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
            {textContent}
          </Text>
        </Box>
      );

    case 'tool': {
      // Extract tool name from tool message if available
      const toolName = (message as { toolName?: string }).toolName || 
                       (message as { name?: string }).name || 
                       'Tool';
      return (
        <Box 
          marginBottom={0}
          paddingX={paddingX}
          paddingY={paddingY}
          alignItems="center"
        >
          <Text color={bubbleTheme.tool.text} bold>
            {bubbleTheme.tool.icon} 
          </Text>
          <Text color={bubbleTheme.tool.text}>
            {toolName}
          </Text>
        </Box>
      );
    }

    case 'system':
      return (
        <Box 
          marginBottom={0}
          paddingX={paddingX}
          >
          <Text color={bubbleTheme.system.text} dimColor>
            {bubbleTheme.system.icon} {textContent}
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
          <Text>{textContent}</Text>
        </Box>
      );
  }
});

// Keep MessageComponent as alias for backward compatibility
export const MessageComponent = MessageBubble;
