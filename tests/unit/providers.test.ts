import { afterEach, describe, expect, it } from 'vitest';
import {
  getAvailableModels,
  getAvailableProviders,
  getDefaultModel,
  getModel,
  normalizeModelId,
  normalizeProviderId,
  parseModelId,
  validateModel,
} from '../../src/providers/index.js';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('provider registry', () => {
  it('returns the public provider ids in fixed order', () => {
    expect(getAvailableProviders()).toEqual(['openrouter', 'gemini', 'gpt', 'anthropic']);
  });

  it('normalizes legacy provider and model ids', () => {
    expect(normalizeProviderId('openai')).toBe('gpt');
    expect(normalizeProviderId('google')).toBe('gemini');
    expect(normalizeModelId('openai/gpt-4o')).toBe('gpt/gpt-4o');
    expect(normalizeModelId('google/gemini-2.5-flash')).toBe('gemini/gemini-2.5-flash');
  });

  it('lists renamed provider models', () => {
    expect(getDefaultModel('gpt')).toBe('gpt/gpt-4o');
    expect(getDefaultModel('openai')).toBe('gpt/gpt-4o');
    expect(getAvailableModels('gemini')[0]).toMatchObject({
      id: 'gemini/gemini-2.5-flash',
    });
  });

  it('parses provider scoped model ids with nested slashes', () => {
    expect(parseModelId('openrouter/deepseek/deepseek-r1:free')).toEqual({
      provider: 'openrouter',
      model: 'deepseek/deepseek-r1:free',
    });
  });

  it('validates legacy ids through compatibility aliases', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    expect(validateModel('openai/gpt-4o')).toMatchObject({
      valid: true,
      provider: 'gpt',
      modelName: 'gpt-4o',
    });
  });

  it('routes gpt and gemini providers to SDK model factories', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key';

    expect(() => getModel('gpt', 'gpt-4o')).not.toThrow();
    expect(() => getModel('gemini', 'gemini-2.5-flash')).not.toThrow();
  });
});
