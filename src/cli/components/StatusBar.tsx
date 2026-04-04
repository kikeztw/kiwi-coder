import { useMemo, useCallback } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { colors } from '../theme/colors.js';
import type { Session } from '../hooks/useSession.js';

interface StatusBarProps {
  session: Session;
  currentAgent?: string;
  modelDisplayName?: string;
}

export function StatusBar({ session, currentAgent = 'coder', modelDisplayName }: StatusBarProps) {
  const { status, modelProvider, modelName } = session;

  const getStatusColor = useCallback(() => {
    switch (status) {
      case 'thinking': return colors.info;
      case 'acting': return colors.warning;
      case 'reviewing': return colors.accent;
      case 'error': return colors.error;
      default: return colors.success;
    }
  }, [status]);

  const getStatusText = useCallback(() => {
    switch (status) {
      case 'thinking': return 'Thinking...';
      case 'acting': return 'Executing tools...';
      case 'reviewing': return 'Waiting for confirmation...';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  }, [status]);

  const isLoading = useMemo(() => status === 'thinking' || status === 'acting', [status]);
  
  // Format model display: use display name if available, otherwise fall back to provider/model
  const modelDisplay = useMemo(() => modelDisplayName || `${modelProvider}/${modelName}`, [modelDisplayName, modelProvider, modelName]);

  const statusColor = useMemo(() => getStatusColor(), [getStatusColor]);
  const statusText = useMemo(() => getStatusText(), [getStatusText]);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={colors.borderSubtle}>
      {/* Top row: Logo, Model, Agent, Status */}
      <Box justifyContent="space-between" paddingX={1} paddingY={0}>
        <Box gap={2}>
          <Text color={colors.highlight} bold>
            🤖 Kiwi
          </Text>
          <Text color={colors.textSecondary}>
            ({modelProvider}/{modelDisplayName || modelName})
          </Text>
        </Box>
        <Box gap={2}>
          <Text color={colors.textMuted}>
            [{currentAgent}]
          </Text>
          <Text color={statusColor}>
            {statusText}
          </Text>
        </Box>
      </Box>
      
      {/* Bottom row: Status bar with spinner and mode */}
      <Box justifyContent="space-between" paddingX={1} paddingY={0}>
        <Box gap={2}>
          <Text color={getStatusColor()}>
            {isLoading ? <Spinner type="dots" /> : '●'} {getStatusText()}
          </Text>
          <Text color={colors.primary}>
            Mode: <Text color={colors.highlight}>/{currentAgent}</Text>
          </Text>
        </Box>
        <Box gap={1}>
          <Text color={colors.system}>Model:</Text>
          <Text color={colors.secondary}>{modelDisplay}</Text>
        </Box>
      </Box>
    </Box>
  );
}
