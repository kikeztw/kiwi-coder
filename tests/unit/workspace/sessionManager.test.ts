import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UIMessage } from 'ai';
import {
  createSession,
  deleteSession,
  ensureKiwiDir,
  listSessions,
  loadActiveSession,
  loadMessages,
  loadSession,
  saveMessages,
  setActiveSession,
  updateSessionModel,
} from '../../../src/workspace/sessionManager.js';
import { createTmpProject, type TmpProject } from '../../helpers/createTmpProject.js';

const model = {
  provider: 'openai',
  model: 'gpt-4o',
  modelId: 'openai/gpt-4o',
  name: 'gpt-4o',
};

describe('sessionManager', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('creates, lists, and loads session metadata without messages', () => {
    ensureKiwiDir(project.projectPath);

    const session = createSession(project.projectPath, model, 'coder', 'Test session');
    const loaded = loadSession(project.projectPath, session.id);
    const sessions = listSessions(project.projectPath);

    expect(loaded).toMatchObject({
      id: session.id,
      projectPath: project.projectPath,
      model,
      agent: 'coder',
      messageCount: 0,
      metadata: { description: 'Test session' },
    });
    expect(sessions).toEqual([
      expect.objectContaining({
        id: session.id,
        messageCount: 0,
        description: 'Test session',
      }),
    ]);
    expect(loadMessages(project.projectPath, session.id)).toEqual([]);
  });

  it('saves messages and updates message count in the index', () => {
    const session = createSession(project.projectPath, model, 'coder');
    const messages = [
      {
        id: 'message-1',
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
      },
    ] as UIMessage[];

    saveMessages(project.projectPath, session.id, messages);

    expect(loadMessages(project.projectPath, session.id)).toEqual(messages);
    expect(loadSession(project.projectPath, session.id)?.messageCount).toBe(1);
    expect(listSessions(project.projectPath)[0].messageCount).toBe(1);
  });

  it('tracks and loads the active session', () => {
    const session = createSession(project.projectPath, model, 'plan');

    setActiveSession(project.projectPath, session.id);

    expect(loadActiveSession(project.projectPath)).toMatchObject({
      id: session.id,
      agent: 'plan',
    });
  });

  it('updates model metadata without changing the session id', () => {
    const session = createSession(project.projectPath, model, 'coder');

    const updated = updateSessionModel(
      project.projectPath,
      session.id,
      'anthropic',
      'claude-sonnet-4',
      'anthropic/claude-sonnet-4',
      'Claude Sonnet 4',
    );

    expect(updated).toMatchObject({
      id: session.id,
      model: {
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        modelId: 'anthropic/claude-sonnet-4',
        name: 'Claude Sonnet 4',
      },
    });
  });

  it('deletes a session and clears it from the index', () => {
    const session = createSession(project.projectPath, model, 'coder');
    setActiveSession(project.projectPath, session.id);

    expect(deleteSession(project.projectPath, session.id)).toBe(true);

    expect(loadSession(project.projectPath, session.id)).toBeNull();
    expect(loadActiveSession(project.projectPath)).toBeNull();
    expect(listSessions(project.projectPath)).toEqual([]);
  });
});
