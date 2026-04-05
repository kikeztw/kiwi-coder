import { memo } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';

interface InputBoxProps {
  input: string;
  isProcessing: boolean;
}

export const InputBox = memo(function InputBox({ input, isProcessing }: InputBoxProps) {
  return (
    <Box
      paddingX={1}
      paddingY={1}
      borderStyle="single"
      borderColor={colors.borderUser}
    >
      <Text color={colors.accentUser} bold>{`❯ `}</Text>
      <Text>{isProcessing ? 'Agent is thinking...' : input}</Text>
    </Box>
  );
});
