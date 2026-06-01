import { describe, expect, it } from 'vitest';
import {
  ElectronAdapter,
  TerminalAdapter,
  WebAdapter,
} from '../../../src/infrastructure/index.js';

describe('UI adapters', () => {
  it('keeps terminal adapter state in sync with UI operations', async () => {
    const adapter = new TerminalAdapter();

    adapter.navigate('/sessions');
    adapter.showSpinner(true);
    adapter.renderMessage({
      sessionId: 'session-1',
      role: 'assistant',
      content: 'hello',
    });
    await adapter.promptInput('Type your message');
    adapter.notify('Done', 'success');
    adapter.applyTheme('dark');

    const snapshot = adapter.snapshot();
    expect(snapshot.route).toBe('/sessions');
    expect(snapshot.spinnerActive).toBe(true);
    expect(snapshot.messages).toHaveLength(1);
    expect(snapshot.prompts).toEqual(['Type your message']);
    expect(snapshot.notifications[0]).toEqual({ level: 'success', message: 'Done' });
    expect(snapshot.activeTheme).toBe('dark');
  });

  it('exposes specific adapter names for web and electron', () => {
    expect(new WebAdapter().name).toBe('web');
    expect(new ElectronAdapter().name).toBe('electron');
  });
});
