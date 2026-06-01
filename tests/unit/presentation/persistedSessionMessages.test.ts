import { describe, expect, it } from 'vitest';
import type { UIMessage } from 'ai';
import { resolveMessagePersistenceAction } from '../../../src/presentation/terminal/hooks/usePersistedSessionMessages.js';

const message = {
  id: 'message-1',
  role: 'user',
  parts: [{ type: 'text', text: 'hello' }],
} as UIMessage;

describe('resolveMessagePersistenceAction', () => {
  it('skips when no session id exists', () => {
    const action = resolveMessagePersistenceAction({
      sessionId: null,
      status: 'ready',
      messages: [message],
      initialMessages: [message],
      persistedRefValue: null,
    });

    expect(action).toBe('skip');
  });

  it('skips while chat is not ready', () => {
    const action = resolveMessagePersistenceAction({
      sessionId: 'session-1',
      status: 'streaming',
      messages: [message],
      initialMessages: [message],
      persistedRefValue: null,
    });

    expect(action).toBe('skip');
  });

  it('marks loaded when first ready frame still equals initial snapshot', () => {
    const initialMessages = [message];
    const action = resolveMessagePersistenceAction({
      sessionId: 'session-1',
      status: 'ready',
      messages: initialMessages,
      initialMessages,
      persistedRefValue: null,
    });

    expect(action).toBe('mark-loaded');
  });

  it('persists when ready messages changed from initial snapshot', () => {
    const action = resolveMessagePersistenceAction({
      sessionId: 'session-1',
      status: 'ready',
      messages: [message],
      initialMessages: [],
      persistedRefValue: null,
    });

    expect(action).toBe('persist');
  });

  it('skips when this exact message array has already been persisted', () => {
    const messages = [message];
    const action = resolveMessagePersistenceAction({
      sessionId: 'session-1',
      status: 'ready',
      messages,
      initialMessages: [],
      persistedRefValue: messages,
    });

    expect(action).toBe('skip');
  });
});
