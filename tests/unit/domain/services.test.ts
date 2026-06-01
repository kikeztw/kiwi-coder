import { describe, expect, it } from 'vitest';
import {
  AgentOrchestrator,
  EventTypes,
  Model,
  ModelId,
  ModelService,
  ToolExecutor,
  type DomainEvent,
  type EventBus,
  type EventType,
} from '../../../src/domain/index.js';

class FakeEventBus implements EventBus {
  readonly events: DomainEvent[] = [];

  async publish<TEvent extends DomainEvent>(event: TEvent): Promise<void> {
    this.events.push(event);
  }

  subscribe<TEvent extends DomainEvent>(
    _type: EventType,
    _handler: (event: TEvent) => void | Promise<void>,
  ): () => void {
    return () => undefined;
  }
}

describe('domain services', () => {
  it('publishes agent lifecycle and tool events', async () => {
    const eventBus = new FakeEventBus();

    await new AgentOrchestrator(eventBus).completeStep({
      sessionId: 'session-1',
      agent: 'coder',
      step: 'analysis',
    });

    await new ToolExecutor(eventBus).called({
      sessionId: 'session-1',
      toolName: 'read_file',
      toolCallId: 'tool-1',
    });

    expect(eventBus.events[0]?.type).toBe(EventTypes.AGENT_STEP_COMPLETED);
    expect(eventBus.events[1]?.type).toBe(EventTypes.TOOL_CALLED);
  });

  it('validates model compatibility and publishes model change events', async () => {
    const eventBus = new FakeEventBus();
    const modelService = new ModelService(eventBus);
    const model = Model.create({
      id: ModelId.create('openai/gpt-4o'),
      provider: 'openai',
      model: 'gpt-4o',
      name: 'GPT-4o',
      isDefault: true,
    });

    const result = await modelService.ensureCompatible(model);
    await modelService.notifyModelChanged({
      sessionId: 'session-1',
      previousModelId: 'openai/gpt-4o-mini',
      currentModelId: 'openai/gpt-4o',
    });

    expect(result.id.toString()).toBe('openai/gpt-4o');
    expect(eventBus.events.at(-1)?.type).toBe(EventTypes.MODEL_CHANGED);
  });
});
