import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { ModelMessage } from 'ai';

interface MessageProps {
  message: ModelMessage;
}

// Helper to extract text content from ModelMessage
function getTextContent(content: ModelMessage['content']): string {
  if (typeof content === 'string') {
    return content;
  }
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

export function MessageComponent({ message }: MessageProps) {
  const { role, content } = message;
  const textContent = getTextContent(content);

  switch (role) {
    case 'user':
      return (
        <Box marginBottom={1}>
          <Text color={colors.user} bold>{`❯ `}</Text>
          <Text color={colors.user}>{textContent}</Text>
        </Box>
      );

    case 'assistant':
      return (
        <Box marginBottom={1} flexDirection="column">
          <Text color={colors.agent} bold>{`🤖 Assistant`}</Text>
          <Text color={colors.agent}>{textContent}</Text>
        </Box>
      );

    case 'tool': {
      const toolName = (message as { toolName?: string }).toolName || 
                      (message as { name?: string }).name || 
                      'Tool';
      return (
        <Box marginBottom={1} flexDirection="column">
          <Text color={colors.tool} bold>{`⚡ ${toolName}`}</Text>
          <Text color={colors.tool}>{textContent}</Text>
        </Box>
      );
    }

    case 'system':
      return (
        <Box marginBottom={1}>
          <Text color={colors.system} dimColor>{`ℹ ${textContent}`}</Text>
        </Box>
      );

    default:
      return (
        <Box marginBottom={1}>
          <Text>{textContent}</Text>
        </Box>
      );
  }
}
