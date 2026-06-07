import { memo } from 'react';
import { Box, Text, Spinner } from '@orchetron/storm';
import { colors } from '../theme/colors.js';

interface ProcessingIndicatorProps {
  status: string;
}

function ProcessingIndicatorInternal({ status }: ProcessingIndicatorProps) {
  if (status !== 'streaming' && status !== 'submitted') {
    return null;
  }
  return (
    <Box paddingX={1} flexShrink={0}>
      <Text color={colors.textSecondary}>
        <Spinner type="dots" /> {status === 'submitted' ? 'Waiting for model...' : 'Streaming...'}
      </Text>
    </Box>
  );
}

export const ProcessingIndicator = memo(ProcessingIndicatorInternal);
