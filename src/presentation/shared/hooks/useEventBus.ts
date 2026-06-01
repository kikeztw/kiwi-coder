import { useCallback } from 'react';
import type { DomainEvent } from '../../../domain/events/DomainEvent.js';
import type { EventType } from '../../../domain/events/EventTypes.js';
import type { EventHandler } from '../../../domain/events/EventHandler.js';
import type { IEventBus } from '../../../application/ports/IEventBus.js';

export function useEventBus(eventBus: IEventBus) {
  const publish = useCallback(
    async <TEvent extends DomainEvent>(event: TEvent): Promise<void> => {
      await eventBus.publish(event);
    },
    [eventBus],
  );

  const subscribe = useCallback(
    <TEvent extends DomainEvent>(type: EventType, handler: EventHandler<TEvent>) =>
      eventBus.subscribe(type, handler),
    [eventBus],
  );

  return { publish, subscribe };
}
