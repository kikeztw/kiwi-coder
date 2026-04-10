import { memo } from 'react';
import { Box, Text } from 'ink';
import { bubbleTheme } from '../theme/colors.js';
import type { UIMessage } from 'ai';

interface MessageProps {
  message: UIMessage;
}

const paddingX = 1;
const paddingY = 2;

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
          
          // if(part.type === 'tool-invocation') {
          //   return (
          //     <Box key={index} marginBottom={0} paddingX={paddingX} alignItems="flex-start">
          //       <Text color={bubbleTheme.tool.text} bold>
          //         {bubbleTheme.tool.icon} 
          //       </Text>
          //       <Text color={bubbleTheme.tool.text}>
          //         {part.title || part.toolCallId}
          //       </Text>
          //     </Box>
          //   );
          // }

          // if(part.type === 'tool-result') {
          //   return (
          //     <Box key={index} marginBottom={0} paddingX={paddingX} alignItems="flex-start">
          //       <Text color={bubbleTheme.tool.text} dimColor>
          //         → Result
          //       </Text>
          //     </Box>
          //   );
          // }

          // if(part.type === 'reasoning') {
          //   return (
          //     <Box 
          //       key={index}
          //       marginBottom={0}
          //       paddingX={paddingX}
          //       paddingY={paddingY}
          //       alignItems="flex-start"
          //     >
          //       <Text color={bubbleTheme.agent.text} dimColor italic>
          //         💭 {part.text}
          //       </Text>
          //     </Box>
          //   );
          // }
          
          return null;
        })}
      </Box>
    );
  }
  
  if(role === 'system'){
    return (
      <Box flexDirection="column">
        {parts.map((part, index) => {
          if(part.type === 'text') {
            return (
              <Box 
                key={index}
                marginBottom={0}
                paddingX={paddingX}
              >
                <Text color={bubbleTheme.system.text} dimColor>
                  {bubbleTheme.system.icon} {part.text}
                </Text>
              </Box>
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
