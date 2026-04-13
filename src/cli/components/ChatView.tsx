import { memo, useState, useCallback } from 'react';
import { Box } from 'ink';
import { useInput } from 'ink';

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
  const { messages, sendMessage } = useHandlerChat();
 
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

  return (
    <Box flexDirection="column">
      <WelcomeScreen />
      <Box flexDirection="column" paddingX={1}>
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
      </Box>
      <StatusBar />
      <InputBox input={input} />
    </Box>
  );
}

export const ChatView = memo(ChatViewInternal);