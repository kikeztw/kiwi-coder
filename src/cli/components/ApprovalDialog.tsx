import { memo } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';

interface ApprovalDialogProps {
  command: string;
  description?: string;
  isActive: boolean;
  onApprove: (approved: boolean) => void;
}

export const ApprovalDialog = memo(function ApprovalDialog({ command, description, isActive, onApprove }: ApprovalDialogProps) {
  useInput((char) => {
    if (!isActive) return;
    if (char === 'y') onApprove(true);
    if (char === 'n') onApprove(false);
  });

  return (
    <Box
      flexDirection="column"
      marginX={1}
      marginY={0}
      borderStyle="round"
      borderColor={isActive ? colors.warning : colors.borderSubtle}
      paddingX={1}
      paddingY={0}
    >
      <Box marginBottom={1}>
        <Text color={isActive ? colors.warning : colors.textMuted} bold>
          ⚠  Command Approval Required
        </Text>
        {!isActive && (
          <Text color={colors.textMuted}> (waiting...)</Text>
        )}
      </Box>

      <Box marginBottom={1}>
        <Text color={colors.textSecondary} bold>$ </Text>
        <Text color={isActive ? colors.textPrimary : colors.textMuted} bold>{command}</Text>
      </Box>

      {description && (
        <Box marginBottom={1}>
          <Text color={colors.textSecondary}>{description}</Text>
        </Box>
      )}

      <Box>
        {isActive ? (
          <>
            <Text color={colors.textMuted}>Approve? </Text>
            <Text color={colors.success} bold>y</Text>
            <Text color={colors.textMuted}> to approve, </Text>
            <Text color={colors.accentError} bold>n</Text>
            <Text color={colors.textMuted}> to deny</Text>
          </>
        ) : (
          <Text color={colors.textMuted}>Pending response...</Text>
        )}
      </Box>
    </Box>
  );
});
