import { describe, expect, it } from 'vitest';
import type { UIMessage } from 'ai';
import { MessageApplicationService } from '../../../src/application/index.js';
import type { IChatHistoryStore } from '../../../src/application/index.js';

class FakeChatHistoryStore implements IChatHistoryStore {
  private readonly sessions = new Map<string, UIMessage[]>();

  load(sessionId: string): UIMessage[] {
    return this.sessions.get(sessionId) ?? [];
  }

  save(sessionId: string, messages: UIMessage[]): void {
    this.sessions.set(sessionId, messages);
  }
}

describe('MessageApplicationService', () => {
  it('loads stored message snapshots by session id', () => {
    const store = new FakeChatHistoryStore();
    const service = new MessageApplicationService(store);
    const messages = [
      {
        id: 'message-1',
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
      },
    ] as UIMessage[];

    service.saveSnapshot('session-1', messages);

    expect(service.loadSnapshot('session-1')).toEqual(messages);
  });

  it('returns an empty snapshot for unknown sessions', () => {
    const service = new MessageApplicationService(new FakeChatHistoryStore());

    expect(service.loadSnapshot('missing-session')).toEqual([]);
  });
});
