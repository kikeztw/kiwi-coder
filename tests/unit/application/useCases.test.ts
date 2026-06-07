import { describe, expect, it } from 'vitest';
import type { UIMessage } from 'ai';
import {
  ChangeAgent,
  ChangeModel,
  DeleteSession,
  ExecuteToolApproval,
  ListModels,
  SendMessage,
  StartSession,
} from '../../../src/application/index.js';
import { Model, ModelId, Session, SessionId, type DomainEvent } from '../../../src/domain/index.js';
import type {
  CreateSessionInput,
  IMessageRepository,
  IModelRepository,
  ISessionRepository,
} from '../../../src/domain/repositories/index.js';
import type { IEventBus } from '../../../src/application/ports/index.js';

const modelDTO = {
  id: 'openai/gpt-4o',
  provider: 'openai',
  model: 'gpt-4o',
  name: 'GPT-4o',
  isDefault: true,
};

class FakeEventBus implements IEventBus {
  readonly events: DomainEvent[] = [];

  async publish<TEvent extends DomainEvent>(event: TEvent): Promise<void> {
    this.events.push(event);
  }

  subscribe(): () => void {
    return () => undefined;
  }
}

class FakeSessionRepository implements ISessionRepository {
  private readonly sessions = new Map<string, Session>();
  private activeId: string | null = null;

  async create(input: CreateSessionInput): Promise<Session> {
    const session = Session.create({
      id: SessionId.create('session-1'),
      created: new Date('2026-05-31T12:00:00.000Z'),
      lastActive: new Date('2026-05-31T12:00:00.000Z'),
      projectPath: input.projectPath,
      model: input.model,
      agent: input.agent,
      messageCount: 0,
      metadata: input.description ? { description: input.description } : undefined,
    });
    this.sessions.set(session.id.toString(), session);
    return session;
  }

  async findById(id: SessionId): Promise<Session | null> {
    return this.sessions.get(id.toString()) ?? null;
  }

  async findActive(): Promise<Session | null> {
    return this.activeId ? this.sessions.get(this.activeId) ?? null : null;
  }

  async setActive(id: SessionId): Promise<void> {
    this.activeId = id.toString();
  }

  async list(): Promise<Session[]> {
    return [...this.sessions.values()];
  }

  async save(session: Session): Promise<void> {
    this.sessions.set(session.id.toString(), session);
  }

  async delete(id: SessionId): Promise<boolean> {
    return this.sessions.delete(id.toString());
  }
}

class FakeMessageRepository implements IMessageRepository {
  private readonly messages = new Map<string, UIMessage[]>();

  async load(sessionId: SessionId): Promise<UIMessage[]> {
    return this.messages.get(sessionId.toString()) ?? [];
  }

  async save(sessionId: SessionId, messages: UIMessage[]): Promise<void> {
    this.messages.set(sessionId.toString(), messages);
  }
}

class FakeModelRepository implements IModelRepository {
  private readonly models = [
    Model.create({
      id: ModelId.create('openai/gpt-4o'),
      provider: 'openai',
      model: 'gpt-4o',
      name: 'GPT-4o',
      isDefault: true,
    }),
  ];

  async list(): Promise<Model[]> {
    return this.models;
  }

  async findById(id: ModelId): Promise<Model | null> {
    return this.models.find((model) => model.id.equals(id)) ?? null;
  }

  async getDefault(provider: string): Promise<Model | null> {
    return this.models.find((model) => model.provider === provider && model.isDefault) ?? null;
  }
}

describe('application use cases', () => {
  it('starts a session and publishes SESSION_CREATED', async () => {
    const sessions = new FakeSessionRepository();
    const eventBus = new FakeEventBus();

    const result = await new StartSession(sessions, eventBus).execute({
      projectPath: '/tmp/project',
      model: modelDTO,
      agent: 'coder',
      description: 'Feature work',
    });

    expect(result).toMatchObject({
      id: 'session-1',
      projectPath: '/tmp/project',
      agent: 'coder',
      description: 'Feature work',
    });
    expect(await sessions.findActive()).toMatchObject({ agent: 'coder' });
    expect(eventBus.events[0]).toMatchObject({
      type: 'SESSION_CREATED',
      payload: { sessionId: 'session-1' },
    });
  });

  it('changes the model for an existing session', async () => {
    const sessions = new FakeSessionRepository();
    const eventBus = new FakeEventBus();
    await new StartSession(sessions, eventBus).execute({
      projectPath: '/tmp/project',
      model: modelDTO,
      agent: 'coder',
    });

    const result = await new ChangeModel(
      sessions,
      eventBus,
      () => new Date('2026-05-31T13:00:00.000Z'),
    ).execute({
      sessionId: 'session-1',
      model: {
        id: 'anthropic/claude-sonnet-4',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        name: 'Claude Sonnet 4',
        isDefault: false,
      },
    });

    expect(result.model.id).toBe('anthropic/claude-sonnet-4');
    expect(eventBus.events.at(-1)).toMatchObject({
      type: 'MODEL_CHANGED',
      payload: {
        sessionId: 'session-1',
        modelId: 'anthropic/claude-sonnet-4',
      },
    });
  });

  it('changes the agent for an existing session', async () => {
    const sessions = new FakeSessionRepository();
    const eventBus = new FakeEventBus();
    await new StartSession(sessions, eventBus).execute({
      projectPath: '/tmp/project',
      model: modelDTO,
      agent: 'coder',
    });

    const result = await new ChangeAgent(
      sessions,
      eventBus,
      () => new Date('2026-05-31T13:00:00.000Z'),
    ).execute({
      sessionId: 'session-1',
      agent: 'plan',
    });

    expect(result.agent).toBe('plan');
    expect((await sessions.findById(SessionId.create('session-1')))?.agent).toBe('plan');
    expect(eventBus.events.at(-1)).toMatchObject({
      type: 'AGENT_CHANGED',
      payload: {
        sessionId: 'session-1',
        agent: 'plan',
      },
    });
  });

  it('fails to change the agent when the session does not exist', async () => {
    await expect(
      new ChangeAgent(new FakeSessionRepository(), new FakeEventBus()).execute({
        sessionId: 'missing-session',
        agent: 'plan',
      }),
    ).rejects.toThrow(/missing-session/);
  });

  it('lists models through the model repository port', async () => {
    const result = await new ListModels(new FakeModelRepository()).execute();

    expect(result).toEqual([modelDTO]);
  });

  it('sends a message and updates session message count', async () => {
    const sessions = new FakeSessionRepository();
    const messages = new FakeMessageRepository();
    const eventBus = new FakeEventBus();
    await new StartSession(sessions, eventBus).execute({
      projectPath: '/tmp/project',
      model: modelDTO,
      agent: 'coder',
    });
    const message = {
      id: 'message-1',
      role: 'user',
      parts: [{ type: 'text', text: 'hello' }],
    } as UIMessage;

    const result = await new SendMessage(
      sessions,
      messages,
      eventBus,
      () => new Date('2026-05-31T13:00:00.000Z'),
    ).execute({
      sessionId: 'session-1',
      message,
    });

    expect(result).toEqual([message]);
    expect((await sessions.findById(SessionId.create('session-1')))?.messageCount).toBe(1);
    expect(eventBus.events.at(-1)).toMatchObject({
      type: 'MESSAGE_SENT',
      payload: {
        sessionId: 'session-1',
        messageId: 'message-1',
      },
    });
  });

  it('publishes tool approval decisions', async () => {
    const eventBus = new FakeEventBus();

    const result = await new ExecuteToolApproval(eventBus).execute({
      toolCallId: 'tool-1',
      approved: false,
      reason: 'No thanks',
    });

    expect(result).toEqual({
      id: 'tool-1',
      approved: false,
      reason: 'No thanks',
    });
    expect(eventBus.events[0]).toMatchObject({
      type: 'TOOL_REJECTED',
      payload: result,
    });
  });

  it('deletes sessions and publishes SESSION_DELETED', async () => {
    const sessions = new FakeSessionRepository();
    const eventBus = new FakeEventBus();
    await new StartSession(sessions, eventBus).execute({
      projectPath: '/tmp/project',
      model: modelDTO,
      agent: 'coder',
    });

    const deleted = await new DeleteSession(sessions, eventBus).execute({
      sessionId: 'session-1',
    });

    expect(deleted).toBe(true);
    expect(await sessions.findById(SessionId.create('session-1'))).toBeNull();
    expect(eventBus.events.at(-1)).toMatchObject({
      type: 'SESSION_DELETED',
      payload: { sessionId: 'session-1' },
    });
  });
});
