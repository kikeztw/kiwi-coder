import { memo, useState, useCallback } from 'react';
import { Box, ChatInput } from '@orchetron/storm';
import { colors } from '../theme/colors.js';

interface InputAreaProps {
  onSubmit: (value: string) => void;
  onExecuteCommand: (command: string) => void;
  isFocused?: boolean;
}

function InputAreaInternal({ onSubmit, onExecuteCommand, isFocused = true }: InputAreaProps) {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const handleSubmit = useCallback(
    (v: string) => {
      if (!v.trim()) return;
      setHistory((prev) => [...prev, v]);
      setValue('');

      if (v.startsWith('/')) {
        onExecuteCommand(v);
      } else {
        onSubmit(v);
      }
    },
    [onSubmit, onExecuteCommand],
  );

  return (
    <Box
      flexDirection="row"
      paddingX={1}
      paddingY={1}
      borderStyle="single"
      borderColor={colors.borderUser}
      flexShrink={0}
    >
      <ChatInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="Type a message..."
        color="#ffffff"
        history={history}
        flex={1}
        isFocused={isFocused}
      />
    </Box>
  );
}

export const InputArea = memo(InputAreaInternal);
