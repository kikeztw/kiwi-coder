import type { EventBus } from '../../domain/events/EventBus.js';

export interface ICorePlugin {
  id: string;
  name: string;
  register(eventBus: EventBus): Promise<void>;
  unregister(eventBus: EventBus): Promise<void>;
}
