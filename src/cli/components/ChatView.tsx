import { memo, useState, useCallback, useMemo } from 'react';
import { Box, Text } from 'ink';
import { Chat } from './Chat.js';
import { agentRegistry } from '../../agents/index.js';
import type { Session } from '../hooks/useSession.js';
import { colors } from '../theme/colors.js';
import TextInput from 'ink-text-input';
import { useInput } from 'ink';

export interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

interface StatusBarProps {
  session: Session;
  currentAgent: string;
  modelDisplayName?: string;
}

export const StatusBar = memo(function StatusBar({ session, currentAgent, modelDisplayName }: StatusBarProps) {
  const { status, modelProvider, modelName } = session;

  const statusColor = useMemo(() => {
    switch (status) {
      case 'thinking': return colors.info;
      case 'acting': return colors.warning;
      case 'reviewing': return colors.accent;
      case 'error': return colors.error;
      default: return colors.success;
    }
  }, [status]);

  const statusText = useMemo(() => {
    switch (status) {
      case 'thinking': return 'Thinking...';
      case 'acting': return 'Executing...';
      case 'reviewing': return 'Reviewing...';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  }, [status]);

  const modelDisplay = useMemo(
    () => modelDisplayName || `${modelProvider}/${modelName}`,
    [modelDisplayName, modelProvider, modelName]
  );

  return (
    <Box justifyContent="space-between" paddingX={1} paddingY={0}>
      <Box gap={2}>
        <Text color={colors.textMuted}>[{currentAgent}]</Text>
        <Text color={statusColor}>● {statusText}</Text>
      </Box>
      <Box gap={1}>
        <Text color={colors.system}>Model:</Text>
        <Text color={colors.secondary}>{modelDisplay}</Text>
      </Box>
    </Box>
  );
});

interface ChatInputProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput = memo(function ChatInput({ onSubmit, disabled, placeholder = 'Type your message...' }: ChatInputProps) {
  const [value, setValue] = useState('');

  useInput((_input, key) => {
    if (key.return && value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue('');
    }
  });

  return (
    <Box flexDirection="column" flexShrink={0}>
      {disabled ? (
        <Box 
          paddingX={1}
          paddingY={1}
          borderStyle="single"
          borderColor={colors.borderSubtle}
        >
          <Text color={colors.textMuted} dimColor>
            ⌛ {placeholder}
          </Text>
        </Box>
      ) : (
        <Box 
          paddingX={1}
          paddingY={1}
          borderStyle="single"
          borderColor={colors.borderUser}
        >
          <Text color={colors.accentUser} bold>{`❯ `}</Text>
          <TextInput
            value={value}
            onChange={setValue}
            placeholder={placeholder}
            showCursor
          />
        </Box>
      )}
    </Box>
  );
});

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

  return (
    <Box flexDirection="column">
      <Chat 
        messages={messages}
        statusBar={
          <StatusBar
            session={session}
            currentAgent={currentAgent}
            modelDisplayName={modelDisplayName}
          />
        }
      />
      <ChatInput
        onSubmit={handleInputSubmit}
        disabled={isProcessing}
        placeholder={isProcessing ? 'Agent is thinking...' : 'Type your message (or exit/quit to close)...'}
      />
    </Box>
  );
}

export const ChatView = memo(ChatViewInternal);

