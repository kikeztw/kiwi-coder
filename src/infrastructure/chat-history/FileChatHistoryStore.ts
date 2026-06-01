import type { UIMessage } from 'ai';
import { loadMessages, saveMessages } from '../../workspace/sessionManager.js';

export class FileChatHistoryStore {
  constructor(private readonly projectPath: string) {}

  load(sessionId: string): UIMessage[] {
    return loadMessages(this.projectPath, sessionId);
  }

  save(sessionId: string, messages: UIMessage[]): void {
    saveMessages(this.projectPath, sessionId, messages);
  }
}
