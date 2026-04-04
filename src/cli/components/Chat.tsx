import { memo, useMemo } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import type { Message } from '../hooks/useMessages.js';
import { MessageBubble } from './MessageBubble.js';

interface ChatProps {
  messages: Message[];
}

// Maximum messages to keep in view to prevent memory issues
const MAX_VISIBLE_MESSAGES = 5;

export const Chat = memo(function Chat({ messages }: ChatProps) {
  // Keep only recent messages to prevent scroll issues
  const visibleMessages = useMemo(
    () => messages.slice(-MAX_VISIBLE_MESSAGES),
    [messages]
  );
  
  return (
    <Box 
      flexDirection="column"
    >
      {messages.length === 0 ? (
        <Box 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          flexGrow={1}
          padding={2}
        >
          <Text color={colors.highlight} bold>
            🤖 Kiwi
          </Text>
          <Text color={colors.textSecondary} dimColor>
            Escribe un mensaje para comenzar...
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" paddingX={1}>
          {visibleMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </Box>
      )}
    </Box>
  );
});
