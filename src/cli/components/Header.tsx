import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';

interface HeaderProps {
  modelName?: string;
  modelProvider?: string;
  currentAgent?: string;
  status?: 'idle' | 'thinking' | 'acting' | 'reviewing' | 'error';
}

export function Header({ modelName, modelProvider, currentAgent = 'coder', status = 'idle' }: HeaderProps) {
  const getStatusColor = (s: typeof status) => {
    switch (s) {
      case 'thinking': return colors.accentThinking;
      case 'acting': return colors.accentTool;
      case 'reviewing': return colors.accentSystem;
      case 'error': return colors.accentError;
      default: return colors.accentAgent;
    }
  };

  const getStatusText = (s: typeof status) => {
    switch (s) {
      case 'thinking': return '💭 thinking...';
      case 'acting': return '⚡ acting...';
      case 'reviewing': return '👁 reviewing...';
      case 'error': return '✗ error';
      default: return '● ready';
    }
  };

  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);

  return (
    <Box 
      flexDirection="row" 
      justifyContent="space-between"
      paddingX={1}
      paddingY={1}
      borderStyle="single"
      borderColor={colors.borderSubtle}
      flexShrink={0}
    >
      {/* Left side: Logo and title */}
      <Box>
        <Text color={colors.highlight} bold>
          🤖 Kiwi
        </Text>
        {modelName && (
          <Text color={colors.textSecondary}>
            {' '}({modelProvider}/{modelName})
          </Text>
        )}
      </Box>

      {/* Right side: Agent and status */}
      <Box>
        <Text color={colors.textMuted}>
          [{currentAgent}]
        </Text>
        <Text color={statusColor}>
          {' '}{statusText}
        </Text>
      </Box>
    </Box>
  );
}
