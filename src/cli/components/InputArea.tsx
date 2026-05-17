import { memo, useState, useCallback } from 'react';
import { useInput } from 'ink';
import { InputBox } from './InputBox.js';

interface InputAreaProps {
  onSubmit: (value: string) => void;
}

function InputAreaInternal({ onSubmit }: InputAreaProps) {
  const [input, setInput] = useState('');

  const submit = useCallback(
    (value: string) => {
      onSubmit(value);
    },
    [onSubmit],
  );

  useInput((character, key) => {
    if (key.return) {
      if (input) {
        submit(input);
        setInput('');
      }
    } else if (key.backspace || key.delete) {
      setInput((current) => current.slice(0, -1));
    } else {
      setInput((current) => current + character);
    }
  });

  return <InputBox input={input} />;
}

export const InputArea = memo(InputAreaInternal);
