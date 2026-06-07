import { useMemo } from 'react';
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
  const { modelProvider, modelName } = session;
  const modelDisplay = useMemo(() => modelDisplayName || `${modelProvider}/${modelName}`, [modelDisplayName, modelProvider, modelName]);

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      borderStyle="single"
      borderColor={colors.borderSubtle}
      paddingX={1}
      flexShrink={0}
    >
      <Text>
        <Text color={colors.primary}>{'  '}Mode: </Text>
        <Text color={colors.highlight}>{currentAgent}</Text>
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
