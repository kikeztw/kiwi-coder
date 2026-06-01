import type { UIMessage } from 'ai';

export interface IChatHistoryStore {
  load(sessionId: string): UIMessage[];
  save(sessionId: string, messages: UIMessage[]): void;
}
