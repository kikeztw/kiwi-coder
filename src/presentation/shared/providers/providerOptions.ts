export const PROVIDER_IDS = ['openrouter', 'gemini', 'gpt', 'anthropic'] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ProviderOption = {
  id: ProviderId;
  label: string;
  description: string;
};

const PROVIDER_LABELS: Record<ProviderId, string> = {
  openrouter: 'OpenRouter',
  gemini: 'Gemini',
  gpt: 'GPT',
  anthropic: 'Anthropic',
};

const PROVIDER_DESCRIPTIONS: Record<ProviderId, string> = {
  openrouter: 'OpenRouter models and free routes',
  gemini: 'Google Gemini models',
  gpt: 'OpenAI GPT models',
  anthropic: 'Anthropic Claude models',
};

export function getProviderOptions(): ProviderOption[] {
  return PROVIDER_IDS.map((id) => ({
    id,
    label: PROVIDER_LABELS[id],
    description: PROVIDER_DESCRIPTIONS[id],
  }));
}

export function isProviderId(value: string): value is ProviderId {
  return PROVIDER_IDS.includes(value as ProviderId);
}
