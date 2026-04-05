import { memo, useState, useCallback } from 'react';
import { Box } from 'ink';
import { agentRegistry } from '../../agents/index.js';
import type { Session } from '../hooks/useSession.js';
import { useInput } from 'ink';
import { MessageBubble } from './MessageBubble.js';
import { StatusBar } from './StatusBar.js';
import { WelcomeScreen } from './WelcomeScreen.js';
import { InputBox } from './InputBox.js';
export interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}


interface ChatViewProps {
  session: Session;
  currentAgent: string;
  modelDisplayName?: string;
  onSubmit: (value: string) => void;
  onExit: () => void;
}

function ChatViewInternal({
  session,
  currentAgent,
  modelDisplayName,
  onSubmit,
  onExit,
}: ChatViewProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const processMessage = useCallback(async (userInput: string) => {
    setIsProcessing(true);

    // Add user message
    addMessage({
      role: 'user',
      content: userInput,
    });

    const agent = agentRegistry.getCurrent();

    const contextMessages = messages
      .filter(m => m.content.trim() !== '')
      .map(m => ({
        role: m.role === 'agent' ? 'assistant' : m.role === 'user' ? 'user' : 'system',
        content: m.content,
      } as { role: 'user' | 'assistant' | 'system'; content: string }));

    try {
      // generateText returns complete response in single chunk
      for await (const chunk of agent.process(userInput, {
        messages: contextMessages,
        sessionId: session.id,
        modelProvider: session.modelProvider,
        modelName: session.modelName,
      })) {
        // Add complete agent response directly
        addMessage({
          role: 'agent',
          content: chunk,
        });
      }
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

    onSubmit(value);
    processMessage(value);
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
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </Box>
      
      <StatusBar
        session={session}
        currentAgent={currentAgent}
        modelDisplayName={modelDisplayName}
      />
      
      <InputBox input={input} isProcessing={isProcessing} />
    </Box>
  );
}

export const ChatView = memo(ChatViewInternal);