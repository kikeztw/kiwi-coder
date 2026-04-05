import { memo } from 'react';
import { Box, Text } from 'ink';
import { ModelMessage } from 'ai';
import { bubbleTheme } from '../theme/colors.js';

interface MessageProps {
  message: ModelMessage;
}

const paddingX = 1;
const paddingY = 2;

export const MessageBubble = memo<MessageProps>(({ message }) => {
  const { role, content } = message;

  if(role === 'user' && typeof content === 'string'){
    return (
        <Box 
          marginBottom={0}
          paddingX={paddingX}
          paddingY={paddingY}
          alignItems="flex-start"
        >
          <Text color={bubbleTheme.user.text} bold>
            {bubbleTheme.user.icon} 
          </Text>
          <Text color={bubbleTheme.user.text}>
            {content}
          </Text>
        </Box>
      );
  }

  if(role === 'assistant' && typeof content === 'string'){
    return (
      <Box 
        marginBottom={0}
        paddingX={paddingX}
        paddingY={paddingY}
        alignItems="flex-start"
      >
        <Text color={bubbleTheme.agent.text} bold>
          {bubbleTheme.agent.icon} 
        </Text>
        <Text color={bubbleTheme.agent.text}>
          {content}
        </Text>
      </Box>
    );
  }

  if(role === 'assistant' && Array.isArray(content)){
    return content.map((item, index) => {
      if(item.type === 'text'){
        return (
          <Box 
            key={`${index}-${item.type}`}
            marginBottom={0}
            paddingX={paddingX}
            paddingY={paddingY}
            alignItems="flex-start"
          >
            <Text color={bubbleTheme.agent.text} bold>
              {bubbleTheme.agent.icon} 
            </Text>
            <Text color={bubbleTheme.agent.text}>
              {item.text}
            </Text>
          </Box>
        );
      }

      if(item.type === 'tool-call'){
        return (
          <Box 
            marginBottom={0}
            paddingX={paddingX}
            paddingY={paddingY}
            alignItems="flex-start"
          >
            <Text color={bubbleTheme.tool.text} bold>
              {bubbleTheme.tool.icon} 
            </Text>
            <Text color={bubbleTheme.tool.text}>
              {item.toolName}
            </Text>
          </Box>
        );
      }

      if(item.type === 'reasoning'){
        return (
          <Box 
            marginBottom={0}
            paddingX={paddingX}
            paddingY={paddingY}
            alignItems="flex-start"
          >
            <Text color={bubbleTheme.agent.text} bold>
              {bubbleTheme.agent.icon} 
            </Text>
            <Text color={bubbleTheme.agent.text}>
              {item.text}
            </Text>
          </Box>
        );
      }

      return null;
    })
  }

  if(role === 'tool' && Array.isArray(content)){
    return content.map((item) => {
      if(item.type === 'tool-result'){
        return null
      }
      return(
        <Box 
          key={item.approvalId}
          marginBottom={0}
          paddingX={paddingX}
          paddingY={paddingY}
          alignItems="flex-start"
        >
          <Text color={bubbleTheme.tool.text} bold>
            {bubbleTheme.tool.icon} 
          </Text>
          <Text color={bubbleTheme.tool.text}>
            {item.approved ? 'Approved' : 'Denied'}
          </Text>
        </Box>
      )
    })
  }
  
  if(role === 'system' && typeof content === 'string'){
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
  }

});

// Keep MessageComponent as alias for backward compatibility
export const MessageComponent = MessageBubble;
