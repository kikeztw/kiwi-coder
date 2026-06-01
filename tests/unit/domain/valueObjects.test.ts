import { describe, expect, it } from 'vitest';
import { ModelId, SessionId, ToolCallId } from '../../../src/domain/index.js';

describe('domain value objects', () => {
  it('creates stable session ids', () => {
    const id = SessionId.create(' abc123 ');

    expect(id.toString()).toBe('abc123');
    expect(id.equals(SessionId.create('abc123'))).toBe(true);
  });

  it('rejects empty session ids', () => {
    expect(() => SessionId.create('')).toThrow(/cannot be empty/);
  });

  it('parses model ids into provider and model names', () => {
    const id = ModelId.create('openai/gpt-4o');

    expect(id.getProvider()).toBe('openai');
    expect(id.getModel()).toBe('gpt-4o');
    expect(id.toString()).toBe('openai/gpt-4o');
  });

  it('keeps provider-scoped model names that contain slashes', () => {
    const id = ModelId.create('openrouter/deepseek/deepseek-r1:free');

    expect(id.getProvider()).toBe('openrouter');
    expect(id.getModel()).toBe('deepseek/deepseek-r1:free');
    expect(id.toString()).toBe('openrouter/deepseek/deepseek-r1:free');
  });

  it('rejects model ids outside provider/model format', () => {
    expect(() => ModelId.create('gpt-4o')).toThrow(/provider\/model/);
    expect(() => ModelId.create('openai/')).toThrow(/provider\/model/);
  });

  it('creates stable tool call ids', () => {
    const id = ToolCallId.create(' tool-1 ');

    expect(id.toString()).toBe('tool-1');
    expect(id.equals(ToolCallId.create('tool-1'))).toBe(true);
  });
});
