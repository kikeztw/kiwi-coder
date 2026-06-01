import { EventTypes } from '../../domain/events/EventTypes.js';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import type { IEventBus } from '../ports/IEventBus.js';

export type DeleteSessionInput = {
  sessionId: string;
};

export class DeleteSession {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: DeleteSessionInput): Promise<boolean> {
    const sessionId = SessionId.create(input.sessionId);
    const deleted = await this.sessions.delete(sessionId);

    if (deleted) {
      await this.eventBus.publish({
        id: `session-deleted-${sessionId.toString()}`,
        type: EventTypes.SESSION_DELETED,
        occurredAt: new Date(),
        payload: { sessionId: sessionId.toString() },
      });
    }

    return deleted;
  }
}
