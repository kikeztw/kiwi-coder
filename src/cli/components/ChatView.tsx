import { memo, useState, useCallback, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import { UIMessage } from 'ai';
import { randomUUID } from 'crypto';
// import { useChat } from '@ai-sdk/react';

import { agentRegistry } from '../../agents/index.js';
import { useSessionContext } from '../context/SessionContext.js';
import { MessageBubble } from './MessageBubble.js';
import { StatusBar } from './StatusBar.js';
import { WelcomeScreen } from './WelcomeScreen.js';
import { InputBox } from './InputBox.js';
import { set } from 'zod/v4';

interface ChatViewProps {
  onSubmit: (value: string) => void;
  onExit: () => void;
}

function ChatViewInternal({
  onSubmit,
  onExit,
}: ChatViewProps) {
  const { session, currentSession, projectPath } = useSessionContext();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [currentUIMessage, setCurrentUIMessage] = useState<UIMessage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCallingTool, setIsCallingTool] = useState('');


  // Load initial messages from session
  useEffect(() => {
    if (currentSession?.messages) {
      setMessages(currentSession.messages);
    }
  }, [currentSession]);

  const processMessage = useCallback(async (userInput: string) => {
    setIsProcessing(true);
    const agent = agentRegistry.getCurrent();

        // Add user message to existing messages
    const userMessage: UIMessage = {
      id: randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text: userInput }]
    };

    const allMessages = [...messages];
    if(currentUIMessage){
      allMessages.push(currentUIMessage);
      setCurrentUIMessage(null);
    }
    allMessages.push(userMessage);
    setMessages(allMessages);
    
    // Small delay to ensure state is flushed
    await new Promise(resolve => setTimeout(resolve, 10));
    
    try {
       await agent.process({
        messages: allMessages,
        session: {
          sessionId: session.id,
          modelProvider: session.modelProvider,
          modelName: session.modelName,
          projectPath,
        },
        onStep: (updatedMessages) => {
          // setMessages((state) => {
          //   const newMessages = [...state];
          //   if(newMessages[newMessages.length -1].role === 'assistant'){
          //     newMessages[newMessages.length -1] = updatedMessages;
          //   }
          //   if(newMessages[newMessages.length -1].role === 'user'){
          //     newMessages.push(updatedMessages);
          //   }
          //   return newMessages;  
          // });
          setCurrentUIMessage(updatedMessages);
        },
        onToolCallStart: (toolCall) => {
          setIsCallingTool(toolCall.toolCall.toolName as string);
        },
        onToolCallFinish: (toolCall) => {
          setIsCallingTool('');
        },
      }); 

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [messages, session, projectPath, currentUIMessage]);

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
      <WelcomeScreen />
      <Box flexDirection="column" paddingX={1}>
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {currentUIMessage && <MessageBubble message={currentUIMessage} />}
      </Box>
      {isCallingTool && (
         <Box 
          marginBottom={0}
          paddingX={1}
          paddingY={1}
          alignItems="flex-start"
        >
            <Text color="blue">• {isCallingTool}</Text>
        </Box>
      )}
      <StatusBar />
      <InputBox input={input} isProcessing={isProcessing} />
    </Box>
  );
}

export const ChatView = memo(ChatViewInternal);