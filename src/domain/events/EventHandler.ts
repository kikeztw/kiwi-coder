import type { DomainEvent } from './DomainEvent.js';

export type EventHandler<TEvent extends DomainEvent = DomainEvent> = (event: TEvent) => void | Promise<void>;
