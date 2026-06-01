import type { UIMessage } from 'ai';
import type { IMessageRepository } from '../../domain/repositories/IMessageRepository.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import { FileChatHistoryStore } from '../chat-history/FileChatHistoryStore.js';

export class FileMessageRepository implements IMessageRepository {
  private readonly chatHistoryStore: FileChatHistoryStore;

  constructor(projectPath: string) {
    this.chatHistoryStore = new FileChatHistoryStore(projectPath);
  }

  async load(sessionId: SessionId): Promise<UIMessage[]> {
    return this.chatHistoryStore.load(sessionId.toString());
  }

  async save(sessionId: SessionId, messages: UIMessage[]): Promise<void> {
    this.chatHistoryStore.save(sessionId.toString(), messages);
  }
}
