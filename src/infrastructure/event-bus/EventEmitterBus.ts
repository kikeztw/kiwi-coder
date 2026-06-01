import type { DomainEvent, EventBus, EventHandler, EventType } from '../../domain/events/index.js';

export class EventEmitterBus implements EventBus {
  private readonly handlers = new Map<EventType, Set<EventHandler>>();

  async publish<TEvent extends DomainEvent>(event: TEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (!handlers) {
      return;
    }

    await Promise.all([...handlers].map((handler) => handler(event)));
  }

  subscribe<TEvent extends DomainEvent>(
    type: EventType,
    handler: EventHandler<TEvent>,
  ): () => void {
    const handlers = this.handlers.get(type) ?? new Set<EventHandler>();
    handlers.add(handler as EventHandler);
    this.handlers.set(type, handlers);

    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    };
  }
}
