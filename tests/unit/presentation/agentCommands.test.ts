import { describe, expect, it } from 'vitest';
import { resolveAgentCommand } from '../../../src/presentation/shared/index.js';

describe('resolveAgentCommand', () => {
  it('treats regular text as a message', () => {
    expect(resolveAgentCommand('hello')).toEqual({ type: 'message' });
  });

  it('resolves supported agent commands', () => {
    expect(resolveAgentCommand('/coder')).toEqual({ type: 'set-agent', agent: 'coder' });
    expect(resolveAgentCommand('/plan')).toEqual({ type: 'set-agent', agent: 'plan' });
  });

  it('supports command arguments without sending the input as a message', () => {
    expect(resolveAgentCommand('/plan now')).toEqual({ type: 'set-agent', agent: 'plan' });
  });

  it('opens provider selection with /model', () => {
    expect(resolveAgentCommand('/model')).toEqual({ type: 'show-provider-selector' });
  });

  it('keeps /code and unknown commands explicit', () => {
    expect(resolveAgentCommand('/code')).toEqual({ type: 'unknown-command', command: 'code' });
    expect(resolveAgentCommand('/wat')).toEqual({ type: 'unknown-command', command: 'wat' });
  });
});
