import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { bubbleTheme } from '../theme/colors.js';

interface ThinkingBubbleProps {
  content: string;
  isExpanded?: boolean;
}

export function ThinkingBubble({ content, isExpanded: initialExpanded = false }: ThinkingBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const theme = bubbleTheme.thinking;

  useInput((input, key) => {
    if (key.return) {
      setIsExpanded(!isExpanded);
    }
  });

  const lines = content.split('\n').filter(line => line.trim() !== '');
  const previewLines = isExpanded ? lines : lines.slice(0, 3);
  const hasMore = lines.length > 3 && !isExpanded;

  return (
    <Box 
      flexDirection="column" 
      marginBottom={1}
      paddingX={1}
      paddingY={1}
      borderStyle="round"
      borderColor={theme.border}
    >
      {/* Header with icon and toggle indicator */}
      <Box>
        <Text color={theme.text}>
          {isExpanded ? '▼' : '▶'} {theme.icon} Thinking...
        </Text>
        <Text color={theme.text} dimColor>
          {' '}(Enter to {isExpanded ? 'collapse' : 'expand'})
        </Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" paddingLeft={2}>
        {previewLines.map((line, index) => (
          <Text key={index} color={theme.text} dimColor>
            {line}
          </Text>
        ))}
        {hasMore && (
          <Text color={theme.text} dimColor>
            ... (+{lines.length - 3} more lines)
          </Text>
        )}
      </Box>
    </Box>
  );
}
