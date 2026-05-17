import { memo } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface ProcessingIndicatorProps {
  status: string;
}

function ProcessingIndicatorInternal({ status }: ProcessingIndicatorProps) {
  if (status !== 'streaming' && status !== 'submitted') {
    return null;
  }
  return (
    <Box marginTop={1} paddingX={1}>
      <Text color="cyan">
        <Spinner type="dots" /> Processing...
      </Text>
    </Box>
  );
}

export const ProcessingIndicator = memo(ProcessingIndicatorInternal);
