import { describe, expect, it } from 'vitest';
import { resolveWebRoute } from '../../../src/presentation/web/router/WebRouter.js';

describe('resolveWebRoute', () => {
  it('resolves chat route with session id', () => {
    expect(resolveWebRoute('/chat/session-123')).toBe('chat');
  });

  it('resolves static routes', () => {
    expect(resolveWebRoute('/settings')).toBe('settings');
    expect(resolveWebRoute('/sessions')).toBe('sessions');
  });

  it('returns null for unknown route', () => {
    expect(resolveWebRoute('/unknown')).toBeNull();
  });
});
