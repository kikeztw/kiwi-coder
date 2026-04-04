import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import type { Message } from '../hooks/useMessages.js';

interface MessageProps {
  message: Message;
}

export function MessageComponent({ message }: MessageProps) {
  const { role, content, metadata } = message;

  switch (role) {
    case 'user':
      return (
        <Box marginBottom={1}>
          <Text color={colors.user} bold>{`❯ `}</Text>
          <Text color={colors.user}>{content}</Text>
        </Box>
      );

    case 'agent':
      return (
        <Box marginBottom={1} flexDirection="column">
          <Text color={colors.agent} bold>{`🤖 Agent`}</Text>
          <Text color={colors.agent}>{content}</Text>
        </Box>
      );

    case 'tool':
      return (
        <Box marginBottom={1} flexDirection="column">
          <Text color={colors.tool} bold>{`⚡ ${metadata?.toolName || 'Tool'}`}</Text>
          {metadata?.toolArgs && (
            <Text color={colors.system} dimColor>
              {JSON.stringify(metadata.toolArgs, null, 2)}
            </Text>
          )}
          <Text color={colors.tool}>{content}</Text>
        </Box>
      );

    case 'system':
      return (
        <Box marginBottom={1}>
          <Text color={colors.system} dimColor>{`ℹ ${content}`}</Text>
        </Box>
      );

    case 'debug':
      return (
        <Box marginBottom={1}>
          <Text color="gray" dimColor>{`🐛 ${content}`}</Text>
        </Box>
      );

    default:
      return (
        <Box marginBottom={1}>
          <Text>{content}</Text>
        </Box>
      );
  }
}
