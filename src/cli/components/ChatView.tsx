import { memo, useState, useCallback } from 'react';
import { Box } from 'ink';
import { ModelMessage } from 'ai';
import { useInput } from 'ink';

import { agentRegistry } from '../../agents/index.js';
import { useSessionContext } from '../context/SessionContext.js';
import { MessageBubble } from './MessageBubble.js';
import { StatusBar } from './StatusBar.js';
import { WelcomeScreen } from './WelcomeScreen.js';
import { InputBox } from './InputBox.js';

interface ChatViewProps {
  onSubmit: (value: string) => void;
  onExit: () => void;
}

function ChatViewInternal({
  onSubmit,
  onExit,
}: ChatViewProps) {
  const { session, addMessage: addMessageToSession, projectPath } = useSessionContext();
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = useCallback((message: ModelMessage) => {
    setMessages(prev => [...prev, message]);
    // Also add to session for persistence
    addMessageToSession(message);
  }, [addMessageToSession]);

  const processMessage = useCallback(async (userInput: string) => {
    setIsProcessing(true);

    // Add user message
    addMessage({
      role: 'user',
      content: userInput,
    });

    const agent = agentRegistry.getCurrent();

    try {
       const response = await agent.process({
        message: userInput,
        context: {
          messages,
          sessionId: session.id,
          modelProvider: session.modelProvider,
          modelName: session.modelName,
          projectPath,
        }
      }); 

      response.forEach(element => {
        addMessage(element);
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addMessage({
        role: 'system',
        content: `Error: ${errorMsg}`,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [messages, session, addMessage]);

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
      processMessage(value);
    }
  }, [processMessage, onSubmit, onExit]);

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
      {messages.length === 0 && <WelcomeScreen />}
      
      <Box flexDirection="column" paddingX={1}>
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
      </Box>
      
      <StatusBar />
      
      <InputBox input={input} isProcessing={isProcessing} />
    </Box>
  );
}

export const ChatView = memo(ChatViewInternal);