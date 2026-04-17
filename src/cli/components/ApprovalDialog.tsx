import { memo } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { colors } from '../theme/colors.js';

interface ApprovalDialogProps {
  command: string;
  description?: string;
  isActive: boolean;
  onApprove: (approved: boolean) => void;
}

const selectItems = [
  { label: 'Yes — approve', value: 'yes' },
  { label: 'No  — deny',    value: 'no'  },
];

export const ApprovalDialog = memo(function ApprovalDialog({ command, description, isActive, onApprove }: ApprovalDialogProps) {
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

      {isActive ? (
        <Box flexDirection="column">
          <Text color={colors.textMuted}>Do you want to proceed?</Text>
          <SelectInput
            items={selectItems}
            onSelect={(item) => onApprove(item.value === 'yes')}
          />
        </Box>
      ) : (
        <Box>
          <Text color={colors.textMuted}>
            <Spinner type="dots" />
          </Text>
          <Text color={colors.textMuted}> Waiting for previous approval...</Text>
        </Box>
      )}
    </Box>
  );
});
