import { EventTypes } from '../events/EventTypes.js';
import type { DomainEvent } from '../events/DomainEvent.js';
import type { EventBus } from '../events/EventBus.js';

export type AgentStepPayload = {
  sessionId: string;
  agent: string;
  step: string;
  metadata?: Record<string, unknown>;
};

export class AgentOrchestrator {
  constructor(private readonly eventBus: EventBus) {}

  async completeStep(payload: AgentStepPayload): Promise<void> {
    const event: DomainEvent<AgentStepPayload> = {
      id: `agent-step-${payload.sessionId}-${Date.now()}`,
      type: EventTypes.AGENT_STEP_COMPLETED,
      occurredAt: new Date(),
      payload,
    };
    await this.eventBus.publish(event);
  }

  async failStep(payload: AgentStepPayload & { error: string }): Promise<void> {
    const event: DomainEvent<typeof payload> = {
      id: `agent-error-${payload.sessionId}-${Date.now()}`,
      type: EventTypes.AGENT_ERROR,
      occurredAt: new Date(),
      payload,
    };
    await this.eventBus.publish(event);
  }
}
