import type { UIMessage } from 'ai';
import { SessionId } from '../value-objects/SessionId.js';

export interface IMessageRepository {
  load(sessionId: SessionId): Promise<UIMessage[]>;
  save(sessionId: SessionId, messages: UIMessage[]): Promise<void>;
}
