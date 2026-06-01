import { describe, expect, it, vi } from 'vitest';
import { createTerminalNavigationService } from '../../../src/presentation/terminal/services/TerminalNavigationService.js';

describe('createTerminalNavigationService', () => {
  it('routes /coder to setCurrentAgent', () => {
    const setCurrentAgent = vi.fn();
    const service = createTerminalNavigationService({
      setCurrentAgent,
      showModelSelector: vi.fn(),
      showSessionSelector: vi.fn(),
      createSession: vi.fn(async () => undefined),
      sessionCount: 0,
    });

    service.handleInput('/coder');

    expect(setCurrentAgent).toHaveBeenCalledWith('coder');
  });

  it('shows delete selector only when sessions exist', () => {
    const showSessionSelectorWithoutSessions = vi.fn();
    const withoutSessions = createTerminalNavigationService({
      setCurrentAgent: vi.fn(),
      showModelSelector: vi.fn(),
      showSessionSelector: showSessionSelectorWithoutSessions,
      createSession: vi.fn(async () => undefined),
      sessionCount: 0,
    });

    withoutSessions.handleInput('/delete-session');
    expect(showSessionSelectorWithoutSessions).not.toHaveBeenCalled();

    const showSessionSelectorWithSessions = vi.fn();
    const withSessions = createTerminalNavigationService({
      setCurrentAgent: vi.fn(),
      showModelSelector: vi.fn(),
      showSessionSelector: showSessionSelectorWithSessions,
      createSession: vi.fn(async () => undefined),
      sessionCount: 2,
    });

    withSessions.handleInput('/delete-session');
    expect(showSessionSelectorWithSessions).toHaveBeenCalledWith('delete');
  });

  it('triggers createSession on /new-session', async () => {
    const createSession = vi.fn(async () => undefined);
    const service = createTerminalNavigationService({
      setCurrentAgent: vi.fn(),
      showModelSelector: vi.fn(),
      showSessionSelector: vi.fn(),
      createSession,
      sessionCount: 0,
    });

    service.handleInput('/new-session');
    await Promise.resolve();

    expect(createSession).toHaveBeenCalledTimes(1);
  });
});
