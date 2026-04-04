import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'agent' | 'tool' | 'system' | 'debug';
  content: string;
  timestamp: Date;
  metadata?: {
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    duration?: number;
  };
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  const setAllMessages = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const addUserMessage = useCallback((content: string) => {
    return addMessage({ role: 'user', content });
  }, [addMessage]);

  const addAgentMessage = useCallback((content: string, metadata?: Message['metadata']) => {
    return addMessage({ role: 'agent', content, metadata });
  }, [addMessage]);

  const updateMessage = useCallback((messageId: string, content: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, content } : msg
    ));
  }, []);

  const addToolMessage = useCallback((content: string, toolName: string, toolArgs?: Record<string, unknown>) => {
    return addMessage({ 
      role: 'tool', 
      content, 
      metadata: { toolName, toolArgs } 
    });
  }, [addMessage]);

  const addSystemMessage = useCallback((content: string) => {
    return addMessage({ role: 'system', content });
  }, [addMessage]);

  const addDebugMessage = useCallback((content: string) => {
    return addMessage({ role: 'debug', content });
  }, [addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    setAllMessages,
    addMessage,
    addUserMessage,
    addAgentMessage,
    updateMessage,
    addToolMessage,
    addSystemMessage,
    addDebugMessage,
    clearMessages,
  };
}
