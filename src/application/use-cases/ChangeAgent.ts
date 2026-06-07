import { EventTypes } from '../../domain/events/EventTypes.js';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import type { IEventBus } from '../ports/IEventBus.js';
import type { SessionDTO } from '../dto/SessionDTO.js';
import { sessionToDTO } from '../mappers/sessionMapper.js';

export type ChangeAgentInput = {
  sessionId: string;
  agent: string;
};

export class ChangeAgent {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly eventBus: IEventBus,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ChangeAgentInput): Promise<SessionDTO> {
    const session = await this.sessions.findById(SessionId.create(input.sessionId));
    if (!session) {
      throw new Error(`Session ${input.sessionId} not found`);
    }

    const updated = session.changeAgent(input.agent, this.now());
    await this.sessions.save(updated);
    await this.eventBus.publish({
      id: `agent-changed-${updated.id.toString()}`,
      type: EventTypes.AGENT_CHANGED,
      occurredAt: this.now(),
      payload: {
        sessionId: updated.id.toString(),
        agent: updated.agent,
      },
    });

    return sessionToDTO(updated);
  }
}
