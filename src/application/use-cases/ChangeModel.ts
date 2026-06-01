import { EventTypes } from '../../domain/events/EventTypes.js';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import type { IEventBus } from '../ports/IEventBus.js';
import type { ModelDTO } from '../dto/ModelDTO.js';
import type { SessionDTO } from '../dto/SessionDTO.js';
import { modelFromDTO } from '../mappers/modelMapper.js';
import { sessionToDTO } from '../mappers/sessionMapper.js';

export type ChangeModelInput = {
  sessionId: string;
  model: ModelDTO;
};

export class ChangeModel {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly eventBus: IEventBus,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ChangeModelInput): Promise<SessionDTO> {
    const session = await this.sessions.findById(SessionId.create(input.sessionId));
    if (!session) {
      throw new Error(`Session ${input.sessionId} not found`);
    }

    const updated = session.changeModel(modelFromDTO(input.model), this.now());
    await this.sessions.save(updated);
    await this.eventBus.publish({
      id: `model-changed-${updated.id.toString()}`,
      type: EventTypes.MODEL_CHANGED,
      occurredAt: this.now(),
      payload: {
        sessionId: updated.id.toString(),
        modelId: updated.model.id.toString(),
      },
    });

    return sessionToDTO(updated);
  }
}
