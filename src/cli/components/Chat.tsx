import { memo, useMemo } from 'react';
import { Box, Text, Static, Spacer } from 'ink';
import { colors } from '../theme/colors.js';
import type { Message } from '../hooks/useMessages.js';
import { MessageBubble } from './MessageBubble.js';

interface ChatProps {
  messages: Message[];
  statusBar?: React.ReactNode;
}

// Maximum messages to keep in view to prevent memory issues
const MAX_VISIBLE_MESSAGES = 50;

export const Chat = memo(function Chat({ messages, statusBar }: ChatProps) {
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
          {/* Static prevents re-rendering of all messages on new additions */}
          <Static items={visibleMessages}>
            {(message: Message) => (<MessageBubble key={message.id} message={message} />)}
          </Static>
        </Box>
      )}
    </Box>
  );
});

