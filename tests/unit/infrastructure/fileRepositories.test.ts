import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UIMessage } from 'ai';
import { Model, ModelId, SessionId } from '../../../src/domain/index.js';
import {
  FileChatHistoryStore,
  FileMessageRepository,
  FileSessionRepository,
} from '../../../src/infrastructure/index.js';
import { createTmpProject, type TmpProject } from '../../helpers/createTmpProject.js';

function createModel() {
  return Model.create({
    id: ModelId.create('openai/gpt-4o'),
    provider: 'openai',
    model: 'gpt-4o',
    name: 'GPT-4o',
    isDefault: true,
  });
}

describe('filesystem repositories', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('creates, activates, lists, and loads sessions through the repository port', async () => {
    const sessions = new FileSessionRepository(project.projectPath);

    const session = await sessions.create({
      projectPath: project.projectPath,
      model: createModel(),
      agent: 'coder',
      description: 'Repository test',
    });
    await sessions.setActive(session.id);

    expect(await sessions.findById(session.id)).toMatchObject({
      agent: 'coder',
      projectPath: project.projectPath,
      messageCount: 0,
    });
    expect(await sessions.findActive()).toMatchObject({
      id: session.id,
      agent: 'coder',
    });
    expect(await sessions.list()).toHaveLength(1);
  });

  it('persists messages through the message repository and updates session count', async () => {
    const sessions = new FileSessionRepository(project.projectPath);
    const messages = new FileMessageRepository(project.projectPath);
    const session = await sessions.create({
      projectPath: project.projectPath,
      model: createModel(),
      agent: 'coder',
    });
    const nextMessages = [
      {
        id: 'message-1',
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
      },
    ] as UIMessage[];

    await messages.save(session.id, nextMessages);

    expect(await messages.load(session.id)).toEqual(nextMessages);
    expect((await sessions.findById(session.id))?.messageCount).toBe(1);
  });

  it('loads and saves chat history synchronously through the chat-history store', async () => {
    const sessions = new FileSessionRepository(project.projectPath);
    const chatHistory = new FileChatHistoryStore(project.projectPath);
    const session = await sessions.create({
      projectPath: project.projectPath,
      model: createModel(),
      agent: 'coder',
    });
    const nextMessages = [
      {
        id: 'message-1',
        role: 'user',
        parts: [{ type: 'text', text: 'sync hello' }],
      },
    ] as UIMessage[];

    chatHistory.save(session.id.toString(), nextMessages);

    expect(chatHistory.load(session.id.toString())).toEqual(nextMessages);
    expect((await sessions.findById(session.id))?.messageCount).toBe(1);
  });

  it('saves model and message count updates without replacing the session id', async () => {
    const sessions = new FileSessionRepository(project.projectPath);
    const session = await sessions.create({
      projectPath: project.projectPath,
      model: createModel(),
      agent: 'coder',
    });
    const nextModel = Model.create({
      id: ModelId.create('anthropic/claude-sonnet-4'),
      provider: 'anthropic',
      model: 'claude-sonnet-4',
      name: 'Claude Sonnet 4',
    });

    await sessions.save(
      session
        .changeModel(nextModel, new Date('2026-05-31T13:00:00.000Z'))
        .withMessageCount(2, new Date('2026-05-31T13:00:00.000Z')),
    );

    const reloaded = await sessions.findById(session.id);
    expect(reloaded?.id.equals(session.id)).toBe(true);
    expect(reloaded?.model.id.toString()).toBe('anthropic/claude-sonnet-4');
    expect(reloaded?.messageCount).toBe(2);
  });

  it('deletes sessions by id', async () => {
    const sessions = new FileSessionRepository(project.projectPath);
    const session = await sessions.create({
      projectPath: project.projectPath,
      model: createModel(),
      agent: 'coder',
    });

    expect(await sessions.delete(SessionId.create(session.id.toString()))).toBe(true);

    expect(await sessions.findById(session.id)).toBeNull();
  });
});
