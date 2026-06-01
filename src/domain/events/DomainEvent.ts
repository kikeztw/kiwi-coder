import type { EventType } from './EventTypes.js';

export type DomainEvent<TPayload = unknown> = {
  id: string;
  type: EventType;
  occurredAt: Date;
  payload: TPayload;
};
