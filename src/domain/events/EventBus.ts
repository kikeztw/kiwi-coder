import type { DomainEvent } from './DomainEvent.js';
import type { EventType } from './EventTypes.js';
import type { EventHandler } from './EventHandler.js';

export interface EventBus {
  publish<TEvent extends DomainEvent>(event: TEvent): Promise<void>;
  subscribe<TEvent extends DomainEvent>(
    type: EventType,
    handler: EventHandler<TEvent>,
  ): () => void;
}
