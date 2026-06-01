import type { UIMessage } from 'ai';
import type { IChatHistoryStore } from '../ports/IChatHistoryStore.js';

export class MessageApplicationService {
  constructor(private readonly historyStore: IChatHistoryStore) {}

  loadSnapshot(sessionId: string): UIMessage[] {
    return this.historyStore.load(sessionId);
  }

  saveSnapshot(sessionId: string, messages: UIMessage[]): void {
    this.historyStore.save(sessionId, messages);
  }
}
