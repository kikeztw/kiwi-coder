import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { colors } from '../theme/colors.js';

interface InputProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function Input({ onSubmit, disabled, placeholder = 'Type your message...' }: InputProps) {
  const [value, setValue] = useState('');

  useInput((input, key) => {
    if (key.return && value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  });

  if (disabled) {
    return (
      <Box 
        paddingX={1}
        paddingY={1}
        borderStyle="single"
        borderColor={colors.borderSubtle}
        flexShrink={0}
      >
        <Text color={colors.textMuted} dimColor>
          ⏳ {placeholder}
        </Text>
      </Box>
    );
  }

  return (
    <Box 
      paddingX={1}
      paddingY={1}
      borderStyle="single"
      borderColor={colors.borderUser}
      flexShrink={0}
    >
      <Text color={colors.accentUser} bold>{`❯ `}</Text>
      <TextInput
        value={value}
        onChange={setValue}
        placeholder={placeholder}
        showCursor
      />
    </Box>
  );
}
