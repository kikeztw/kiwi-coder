import { describe, expect, it } from 'vitest';
import { Model, ModelId, Session, SessionId, Tool } from '../../../src/domain/index.js';

const now = new Date('2026-05-31T12:00:00.000Z');

function createModel() {
  return Model.create({
    id: ModelId.create('openai/gpt-4o'),
    provider: 'openai',
    model: 'gpt-4o',
    name: 'GPT-4o',
    isDefault: true,
  });
}

describe('domain entities', () => {
  it('creates models from valid model metadata', () => {
    const model = createModel();

    expect(model.id.toString()).toBe('openai/gpt-4o');
    expect(model.provider).toBe('openai');
    expect(model.model).toBe('gpt-4o');
    expect(model.name).toBe('GPT-4o');
    expect(model.isDefault).toBe(true);
  });

  it('creates sessions with idle status by default', () => {
    const session = Session.create({
      id: SessionId.create('session-1'),
      created: now,
      lastActive: now,
      projectPath: '/tmp/project',
      model: createModel(),
      agent: 'coder',
      messageCount: 0,
    });

    expect(session.id.toString()).toBe('session-1');
    expect(session.projectPath).toBe('/tmp/project');
    expect(session.status).toBe('idle');
    expect(session.messageCount).toBe(0);
  });

  it('returns updated session instances when changing model and message count', () => {
    const session = Session.create({
      id: SessionId.create('session-1'),
      created: now,
      lastActive: now,
      projectPath: '/tmp/project',
      model: createModel(),
      agent: 'coder',
      messageCount: 0,
    });
    const updatedAt = new Date('2026-05-31T13:00:00.000Z');
    const nextModel = Model.create({
      id: ModelId.create('anthropic/claude-sonnet-4'),
      provider: 'anthropic',
      model: 'claude-sonnet-4',
      name: 'Claude Sonnet 4',
    });

    const updated = session.changeModel(nextModel, updatedAt).withMessageCount(3, updatedAt);

    expect(updated.id.equals(session.id)).toBe(true);
    expect(updated.model.id.toString()).toBe('anthropic/claude-sonnet-4');
    expect(updated.messageCount).toBe(3);
    expect(updated.lastActive).toBe(updatedAt);
  });

  it('rejects sessions with negative message counts', () => {
    expect(() =>
      Session.create({
        id: SessionId.create('session-1'),
        created: now,
        lastActive: now,
        projectPath: '/tmp/project',
        model: createModel(),
        agent: 'coder',
        messageCount: -1,
      }),
    ).toThrow(/messageCount/);
  });

  it('creates tool metadata without binding to an implementation', () => {
    const tool = Tool.create({
      name: 'read_file',
      description: 'Reads files',
      readOnly: true,
      needsApproval: false,
    });

    expect(tool.name).toBe('read_file');
    expect(tool.description).toBe('Reads files');
    expect(tool.readOnly).toBe(true);
    expect(tool.needsApproval).toBe(false);
  });
});
