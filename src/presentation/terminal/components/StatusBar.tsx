import { useMemo, useCallback } from 'react';
import { Box, Text } from '@orchetron/storm';
import { colors } from '../theme/colors.js';
import { useSessionContext } from '../context/index.js';
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

  const statusColor = getStatusColor();
  const statusText = getStatusText();

  return (
    <Box flexDirection="row" justifyContent="space-between" borderStyle="single" borderColor={colors.borderSubtle} paddingX={1}>
      <Text>
        <Text color={statusColor}>{isLoading ? '⠋' : '●'} {statusText}</Text>
        <Text color={colors.primary}>{'  '}Mode: </Text>
        <Text color={colors.highlight}>/{currentAgent}</Text>
      </Text>
      <Text>
        {tokenCounter && (
          <Text>
            <Text color={colors.system}>CTX: </Text>
            <Text color={colors.info}>{formatTokens(tokenCounter.orchestrator.totalTokens)}</Text>
            <Text color={colors.system}> | Total: </Text>
            <Text color={colors.secondary}>{formatTokens(tokenCounter.total.totalTokens)}</Text>
            <Text color={colors.system}>  </Text>
          </Text>
        )}
        <Text color={colors.system}>Model: </Text>
        <Text color={colors.secondary}>{modelDisplay}</Text>
      </Text>
    </Box>
  );
}
