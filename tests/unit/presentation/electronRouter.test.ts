import { describe, expect, it } from 'vitest';
import { resolveElectronRoute } from '../../../src/presentation/electron/renderer/router/ElectronRouter.js';

describe('resolveElectronRoute', () => {
  it('resolves known routes', () => {
    expect(resolveElectronRoute('/chat')).toBe('/chat');
    expect(resolveElectronRoute('/settings')).toBe('/settings');
    expect(resolveElectronRoute('/sessions')).toBe('/sessions');
  });

  it('returns null for unknown routes', () => {
    expect(resolveElectronRoute('/unknown')).toBeNull();
  });
});
