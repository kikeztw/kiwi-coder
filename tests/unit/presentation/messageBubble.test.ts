import { describe, expect, it } from 'vitest';
import { getToolOperationStatus } from '../../../src/presentation/terminal/components/MessageBubble.js';

describe('getToolOperationStatus', () => {
  it('maps streaming tool input to running', () => {
    expect(getToolOperationStatus('input-streaming')).toBe('running');
  });

  it('maps completed AI SDK tool states to completed', () => {
    expect(getToolOperationStatus('output-available')).toBe('completed');
    expect(getToolOperationStatus('approval-responded')).toBe('completed');
  });

  it('maps failed AI SDK tool states to failed', () => {
    expect(getToolOperationStatus('output-error')).toBe('failed');
    expect(getToolOperationStatus('output-denied')).toBe('failed');
  });

  it('keeps pending and unknown states pending', () => {
    expect(getToolOperationStatus('input-available')).toBe('pending');
    expect(getToolOperationStatus('approval-requested')).toBe('pending');
    expect(getToolOperationStatus('unexpected')).toBe('pending');
  });
});
