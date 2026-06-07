import { describe, expect, it } from 'vitest';
import {
  SessionApplicationService,
  type ModelDTO,
} from '../../../src/application/index.js';
import { Session, SessionId, type DomainEvent } from '../../../src/domain/index.js';
import type {
  CreateSessionInput,
  ISessionRepository,
} from '../../../src/domain/repositories/index.js';
import type { IEventBus } from '../../../src/application/ports/index.js';

const defaultModel: ModelDTO = {
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
  private nextId = 1;

  async create(input: CreateSessionInput): Promise<Session> {
    const now = new Date(`2026-05-31T12:00:0${this.nextId}.000Z`);
    const session = Session.create({
      id: SessionId.create(`session-${this.nextId}`),
      created: now,
      lastActive: now,
      projectPath: input.projectPath,
      model: input.model,
      agent: input.agent,
      messageCount: 0,
      metadata: input.description ? { description: input.description } : undefined,
    });
    this.nextId += 1;
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
    if (this.activeId === id.toString()) {
      this.activeId = null;
    }
    return this.sessions.delete(id.toString());
  }
}

describe('SessionApplicationService', () => {
  it('initializes by creating and activating a session when none exists', async () => {
    const repository = new FakeSessionRepository();
    const eventBus = new FakeEventBus();
    const service = new SessionApplicationService(repository, eventBus);

    const result = await service.initialize({
      projectPath: '/tmp/project',
      defaultModel,
      initialAgent: 'coder',
    });

    expect(result.currentSession).toMatchObject({
      id: 'session-1',
      projectPath: '/tmp/project',
      agent: 'coder',
    });
    expect(result.sessions).toEqual([
      expect.objectContaining({
        id: 'session-1',
        messageCount: 0,
      }),
    ]);
    expect(await repository.findActive()).toMatchObject({ agent: 'coder' });
  });

  it('selects an existing session and marks it active', async () => {
    const repository = new FakeSessionRepository();
    const service = new SessionApplicationService(repository, new FakeEventBus());
    await service.create({ projectPath: '/tmp/project', model: defaultModel, agent: 'coder' });
    await service.create({ projectPath: '/tmp/project', model: defaultModel, agent: 'plan' });

    const selected = await service.select('session-2');

    expect(selected).toMatchObject({
      id: 'session-2',
      agent: 'plan',
    });
    expect(await repository.findActive()).toMatchObject({ agent: 'plan' });
  });

  it('changes a session model through the application service', async () => {
    const repository = new FakeSessionRepository();
    const service = new SessionApplicationService(repository, new FakeEventBus());
    await service.create({ projectPath: '/tmp/project', model: defaultModel, agent: 'coder' });

    const updated = await service.changeSessionModel({
      sessionId: 'session-1',
      model: {
        id: 'openrouter/deepseek/deepseek-r1:free',
        provider: 'openrouter',
        model: 'deepseek/deepseek-r1:free',
        name: 'DeepSeek R1 Free',
        isDefault: false,
      },
    });

    expect(updated.model).toMatchObject({
      id: 'openrouter/deepseek/deepseek-r1:free',
      provider: 'openrouter',
      model: 'deepseek/deepseek-r1:free',
    });
  });

  it('changes a session agent through the application service', async () => {
    const repository = new FakeSessionRepository();
    const service = new SessionApplicationService(repository, new FakeEventBus());
    await service.create({ projectPath: '/tmp/project', model: defaultModel, agent: 'coder' });

    const updated = await service.changeSessionAgent({
      sessionId: 'session-1',
      agent: 'plan',
    });

    expect(updated.agent).toBe('plan');
    expect(await repository.findActive()).toMatchObject({ agent: 'plan' });
  });

  it('deletes sessions by id', async () => {
    const repository = new FakeSessionRepository();
    const service = new SessionApplicationService(repository, new FakeEventBus());
    await service.create({ projectPath: '/tmp/project', model: defaultModel, agent: 'coder' });

    expect(await service.delete('session-1')).toBe(true);
    expect(await service.select('session-1')).toBeNull();
  });
});
