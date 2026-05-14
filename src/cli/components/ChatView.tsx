import { memo, useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import Spinner from 'ink-spinner';

// import { useSessionContext } from '../context/SessionContext.js';
import { MessageBubble } from './MessageBubble.js';
import { StatusBar } from './StatusBar.js';
import { WelcomeScreen } from './WelcomeScreen.js';
import { InputBox } from './InputBox.js';
import { useHandlerChat } from '../hooks/useHandlerChat.js';

interface ChatViewProps {
  onSubmit: (value: string) => void;
  onExit: () => void;
}

function ChatViewInternal({
  onSubmit,
  onExit,
}: ChatViewProps) {
  // const { currentSession, currentAgent } = useSessionContext();
  const [input, setInput] = useState('');
  const { messages, sendMessage, addToolApprovalResponse, status, tokenCounter } = useHandlerChat();
 
  const handleInputSubmit = useCallback((value: string) => {
    if (value.toLowerCase() === 'exit' || value.toLowerCase() === 'quit') {
      onExit();
      return;
    }
    // Check if it's a command (starts with /)
    const isCommand = value.startsWith('/');

    // Always call onSubmit to handle commands
    onSubmit(value);

    // Only process with AI if it's not a command
    if (!isCommand) {
      sendMessage({
        text: value,
      });
    }
  }, [onSubmit, onExit]);


  useInput((character, key) => {
		if (key.return) {
			if (input) {
				handleInputSubmit(input);
				setInput('');
			}
		} else if (key.backspace || key.delete) {
			setInput(currentInput => currentInput.slice(0, -1));
		} else {
			setInput(currentInput => currentInput + character);
		}
	});

  // console.log('messages', JSON.stringify(messages, null, 2));

  return (
    <Box flexDirection="column">
      <WelcomeScreen />
      <Box flexDirection="column" paddingX={1}>
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            onApprove={({ id, approved, reason }) =>{
              addToolApprovalResponse({ id, approved, reason })
            }}
          />
        ))}
        {(status === 'streaming' || status === 'submitted') && (
          <Box marginTop={1}>
            <Text color="cyan">
              <Spinner type="dots" /> Processing...
            </Text>
          </Box>
        )}
      </Box>
      <StatusBar tokenCounter={tokenCounter} />
      <InputBox input={input} />
    </Box>
  );
}

export const ChatView = memo(ChatViewInternal);