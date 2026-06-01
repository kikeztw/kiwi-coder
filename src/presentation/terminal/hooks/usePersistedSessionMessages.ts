import { useEffect, useMemo, useRef } from 'react';
import type { UIMessage } from 'ai';

const EMPTY_MESSAGES: UIMessage[] = [];

export type MessagePersistenceAction = 'skip' | 'mark-loaded' | 'persist';

export function resolveMessagePersistenceAction(params: {
  sessionId: string | null;
  status: string;
  messages: UIMessage[];
  initialMessages: UIMessage[];
  persistedRefValue: unknown;
}): MessagePersistenceAction {
  const { sessionId, status, messages, initialMessages, persistedRefValue } = params;

  if (!sessionId) return 'skip';
  if (status !== 'ready') return 'skip';
  if (messages.length === 0) return 'skip';
  if (persistedRefValue === messages) return 'skip';
  if (persistedRefValue === null && messages === initialMessages) return 'mark-loaded';
  return 'persist';
}

export function useSessionMessageSnapshot(params: {
  sessionId: string | null;
  loadSnapshot: (sessionId: string) => UIMessage[];
}): UIMessage[] {
  const { sessionId, loadSnapshot } = params;

  return useMemo(
    () => (sessionId ? loadSnapshot(sessionId) : EMPTY_MESSAGES),
    [sessionId, loadSnapshot],
  );
}

export function usePersistedSessionMessages(params: {
  sessionId: string | null;
  status: string;
  messages: UIMessage[];
  initialMessages: UIMessage[];
  saveSnapshot: (sessionId: string, messages: UIMessage[]) => void;
}): void {
  const { sessionId, status, messages, initialMessages, saveSnapshot } = params;

  // Keep a local ref so we only persist when the assistant cycle settles to "ready".
  const persistedRef = useRef<unknown>(null);
  useEffect(() => {
    const action = resolveMessagePersistenceAction({
      sessionId,
      status,
      messages,
      initialMessages,
      persistedRefValue: persistedRef.current,
    });

    if (action === 'skip') return;
    if (action === 'mark-loaded') {
      persistedRef.current = messages;
      return;
    }

    saveSnapshot(sessionId!, messages);
    persistedRef.current = messages;
  }, [sessionId, status, messages, initialMessages, saveSnapshot]);

}
