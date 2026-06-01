import { EventTypes } from '../events/EventTypes.js';
import type { DomainEvent } from '../events/DomainEvent.js';
import type { EventBus } from '../events/EventBus.js';

export type ToolExecutionPayload = {
  sessionId: string;
  toolName: string;
  toolCallId: string;
  approved?: boolean;
  output?: unknown;
};

export class ToolExecutor {
  constructor(private readonly eventBus: EventBus) {}

  async called(payload: ToolExecutionPayload): Promise<void> {
    const event: DomainEvent<ToolExecutionPayload> = {
      id: `tool-called-${payload.toolCallId}`,
      type: EventTypes.TOOL_CALLED,
      occurredAt: new Date(),
      payload,
    };
    await this.eventBus.publish(event);
  }

  async completed(payload: ToolExecutionPayload): Promise<void> {
    const event: DomainEvent<ToolExecutionPayload> = {
      id: `tool-completed-${payload.toolCallId}`,
      type: EventTypes.TOOL_COMPLETED,
      occurredAt: new Date(),
      payload,
    };
    await this.eventBus.publish(event);
  }
}
