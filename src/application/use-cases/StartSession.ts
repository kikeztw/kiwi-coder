import { EventTypes } from '../../domain/events/EventTypes.js';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import type { IEventBus } from '../ports/IEventBus.js';
import type { ModelDTO } from '../dto/ModelDTO.js';
import type { SessionDTO } from '../dto/SessionDTO.js';
import { modelFromDTO } from '../mappers/modelMapper.js';
import { sessionToDTO } from '../mappers/sessionMapper.js';

export type StartSessionInput = {
  projectPath: string;
  model: ModelDTO;
  agent: string;
  description?: string;
};

export class StartSession {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: StartSessionInput): Promise<SessionDTO> {
    const session = await this.sessions.create({
      projectPath: input.projectPath,
      model: modelFromDTO(input.model),
      agent: input.agent,
      description: input.description,
    });

    await this.sessions.setActive(session.id);
    await this.eventBus.publish({
      id: `session-created-${session.id.toString()}`,
      type: EventTypes.SESSION_CREATED,
      occurredAt: new Date(),
      payload: { sessionId: session.id.toString() },
    });

    return sessionToDTO(session);
  }
}
