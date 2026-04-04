import { Box, Text } from 'ink';
import { colors, bubbleTheme } from '../theme/colors.js';
import type { Message } from '../hooks/useMessages.js';
import { MessageBubble } from './MessageBubble.js';

interface ChatProps {
  messages: Message[];
  streamingContent?: string;
}

// Maximum messages to keep in view to prevent memory issues
const MAX_VISIBLE_MESSAGES = 50;

export function Chat({ messages, streamingContent }: ChatProps) {
  // Keep only recent messages to prevent scroll issues
  const visibleMessages = messages.slice(-MAX_VISIBLE_MESSAGES);
  
  return (
    <Box 
      flexDirection="column" 
      flexGrow={1}
      overflowY="hidden"
    >
      {messages.length === 0 && !streamingContent ? (
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
        <Box flexDirection="column" paddingX={1} paddingY={1}>
          {visibleMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {streamingContent && (
            <Box 
              flexDirection="column" 
              marginBottom={1}
              paddingX={1}
              paddingY={1}
            >
              <Text color={bubbleTheme.agent.text} bold>
                {bubbleTheme.agent.icon} 
              </Text>
              <Text color={bubbleTheme.agent.text}>
                {streamingContent}▌
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
