import { describe, expect, it } from 'vitest';
import { resolveTerminalCommand } from '../../../src/presentation/terminal/router/TerminalRouter.js';

describe('resolveTerminalCommand', () => {
  it('routes regular text as a message', () => {
    expect(resolveTerminalCommand('hello')).toEqual({ type: 'message' });
  });

  it('routes agent commands', () => {
    expect(resolveTerminalCommand('/coder')).toEqual({
      type: 'set-agent',
      agent: 'coder',
    });
    expect(resolveTerminalCommand('/plan')).toEqual({
      type: 'set-agent',
      agent: 'plan',
    });
  });

  it('routes selector commands', () => {
    expect(resolveTerminalCommand('/model')).toEqual({ type: 'show-model-selector' });
    expect(resolveTerminalCommand('/session')).toEqual({
      type: 'show-session-selector',
      mode: 'select',
    });
    expect(resolveTerminalCommand('/sessions')).toEqual({
      type: 'show-session-selector',
      mode: 'select',
    });
  });

  it('routes session mutation commands', () => {
    expect(resolveTerminalCommand('/new-session')).toEqual({ type: 'create-session' });
    expect(resolveTerminalCommand('/delete-session')).toEqual({
      type: 'show-session-selector',
      mode: 'delete',
    });
  });

  it('keeps unknown commands explicit', () => {
    expect(resolveTerminalCommand('/wat')).toEqual({
      type: 'unknown-command',
      command: 'wat',
    });
  });
});
