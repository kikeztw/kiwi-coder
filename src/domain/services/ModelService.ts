import { EventTypes } from '../events/EventTypes.js';
import type { DomainEvent } from '../events/DomainEvent.js';
import type { EventBus } from '../events/EventBus.js';
import { Model } from '../entities/Model.js';

export type ModelChangedPayload = {
  sessionId: string;
  previousModelId: string;
  currentModelId: string;
};

export class ModelService {
  constructor(private readonly eventBus: EventBus) {}

  async ensureCompatible(model: Model): Promise<Model> {
    return model;
  }

  async notifyModelChanged(payload: ModelChangedPayload): Promise<void> {
    const event: DomainEvent<ModelChangedPayload> = {
      id: `model-changed-${payload.sessionId}-${Date.now()}`,
      type: EventTypes.MODEL_CHANGED,
      occurredAt: new Date(),
      payload,
    };
    await this.eventBus.publish(event);
  }
}
