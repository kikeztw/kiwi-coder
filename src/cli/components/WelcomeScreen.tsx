import { memo } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';

export const WelcomeScreen = memo(function WelcomeScreen() {
  return (
    <Box 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      flexGrow={1}
      padding={2}
      gap={1}
    >
      <Box flexDirection="column" alignItems="center" gap={0}>
        <Text color={colors.highlight} bold>
          {'  '}🤖{'  '}
        </Text>
        <Text color={colors.highlight} bold>
          Kiwi AI Assistant
        </Text>
      </Box>
      
      <Box flexDirection="column" alignItems="center" marginTop={1}>
        <Text color={colors.textSecondary}>
          Your intelligent coding assistant
        </Text>
      </Box>

      <Box 
        flexDirection="column" 
        alignItems="flex-start" 
        marginTop={1}
        paddingX={2}
        borderStyle="round"
        borderColor={colors.borderSubtle}
      >
        <Text color={colors.info} bold>
          💡 Quick Commands:
        </Text>
        <Text color={colors.textMuted}>
          {'  '}/coder - Switch to coding agent
        </Text>
        <Text color={colors.textMuted}>
          {'  '}/plan - Switch to planning agent
        </Text>
        <Text color={colors.textMuted}>
          {'  '}/model - Change AI model
        </Text>
        <Text color={colors.textMuted}>
          {'  '}exit - Exit application
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color={colors.accent} dimColor>
          Type your message to get started...
        </Text>
      </Box>
    </Box>
  );
});
