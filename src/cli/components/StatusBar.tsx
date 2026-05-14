import { useMemo, useCallback } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { colors } from '../theme/colors.js';
import { useSessionContext } from '../context/SessionContext.js';
import type { TokenCounter } from '../hooks/useTokenCounter.js';
import { formatTokens } from '../hooks/useTokenCounter.js';

interface StatusBarProps {
  tokenCounter?: TokenCounter;
}

export function StatusBar({ tokenCounter }: StatusBarProps) {
  const { session, currentAgent, modelDisplayName } = useSessionContext();
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
  const modelDisplay = useMemo(() => modelDisplayName || `${modelProvider}/${modelName}`, [modelDisplayName, modelProvider, modelName]);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={colors.borderSubtle}>
      <Box justifyContent="space-between" paddingX={1} paddingY={0}>
        <Box gap={2}>
          <Text color={getStatusColor()}>
            {isLoading ? <Spinner type="dots" /> : '●'} {getStatusText()}
          </Text>
          <Text color={colors.primary}>
            Mode: <Text color={colors.highlight}>/{currentAgent}</Text>
          </Text>
        </Box>
        <Box gap={2}>
          {tokenCounter && (
            <Box gap={1}>
              <Text color={colors.system}>CTX:</Text>
              <Text color={colors.info}>{formatTokens(tokenCounter.orchestrator.totalTokens)}</Text>
              <Text color={colors.system}>|</Text>
              <Text color={colors.system}>Total:</Text>
              <Text color={colors.secondary}>{formatTokens(tokenCounter.total.totalTokens)}</Text>
            </Box>
          )}
          <Box gap={1}>
            <Text color={colors.system}>Model:</Text>
            <Text color={colors.secondary}>{modelDisplay}</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
