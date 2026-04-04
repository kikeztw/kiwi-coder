import React from 'react';
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

  const getStatusColor = () => {
    switch (status) {
      case 'thinking': return colors.info;
      case 'acting': return colors.warning;
      case 'reviewing': return colors.accent;
      case 'error': return colors.error;
      default: return colors.success;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'thinking': return 'Thinking...';
      case 'acting': return 'Executing tools...';
      case 'reviewing': return 'Waiting for confirmation...';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  const isLoading = status === 'thinking' || status === 'acting';
  
  // Format model display: use display name if available, otherwise fall back to provider/model
  const modelDisplay = modelDisplayName || `${modelProvider}/${modelName}`;

  return (
    <Box justifyContent="space-between" padding={1}>
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
  );
}
