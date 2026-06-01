import { describe, expect, it } from 'vitest';
import { EventEmitterBus } from '../../../src/infrastructure/index.js';
import { EventTypes, type DomainEvent } from '../../../src/domain/index.js';

describe('EventEmitterBus', () => {
  it('publishes events to subscribed handlers', async () => {
    const bus = new EventEmitterBus();
    const received: DomainEvent[] = [];

    bus.subscribe(EventTypes.SESSION_CREATED, (event) => {
      received.push(event);
    });

    await bus.publish({
      id: 'event-1',
      type: EventTypes.SESSION_CREATED,
      occurredAt: new Date('2026-05-31T12:00:00.000Z'),
      payload: { sessionId: 'session-1' },
    });

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      id: 'event-1',
      type: EventTypes.SESSION_CREATED,
      payload: { sessionId: 'session-1' },
    });
  });

  it('unsubscribes handlers', async () => {
    const bus = new EventEmitterBus();
    const received: DomainEvent[] = [];
    const unsubscribe = bus.subscribe(EventTypes.MODEL_CHANGED, (event) => {
      received.push(event);
    });

    unsubscribe();
    await bus.publish({
      id: 'event-1',
      type: EventTypes.MODEL_CHANGED,
      occurredAt: new Date('2026-05-31T12:00:00.000Z'),
      payload: { sessionId: 'session-1' },
    });

    expect(received).toEqual([]);
  });
});
