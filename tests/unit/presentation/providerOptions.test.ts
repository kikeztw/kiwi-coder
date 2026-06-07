import { describe, expect, it } from 'vitest';
import {
  getProviderOptions,
  isProviderId,
  PROVIDER_IDS,
} from '../../../src/presentation/shared/index.js';

describe('provider options', () => {
  it('keeps providers in the expected order', () => {
    expect(PROVIDER_IDS).toEqual(['openrouter', 'gemini', 'gpt', 'anthropic']);
  });

  it('exposes readable labels and descriptions', () => {
    expect(getProviderOptions()).toEqual([
      expect.objectContaining({ id: 'openrouter', label: 'OpenRouter' }),
      expect.objectContaining({ id: 'gemini', label: 'Gemini' }),
      expect.objectContaining({ id: 'gpt', label: 'GPT' }),
      expect.objectContaining({ id: 'anthropic', label: 'Anthropic' }),
    ]);
  });

  it('recognizes provider ids', () => {
    expect(isProviderId('gemini')).toBe(true);
    expect(isProviderId('google')).toBe(false);
  });
});
