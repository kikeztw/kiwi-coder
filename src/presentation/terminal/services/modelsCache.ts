import {
  getAllModels,
  fetchGeminiModels,
  fetchOpenRouterModels,
  type ModelInfo,
} from '../../../providers/index.js';

export type StaticModel = ModelInfo & { provider: string };

export interface CacheState {
  /** Models from the static registry, available immediately. */
  static: StaticModel[];
  /** Live Gemini models, or null if not fetched yet / no API key. */
  google: ModelInfo[] | null;
  /** Live OpenRouter free models, or null if not fetched yet / no API key. */
  openrouter: ModelInfo[] | null;
  loading: { google: boolean; openrouter: boolean };
  errors: { google?: string; openrouter?: string };
  /** True once every applicable remote fetch has resolved (success or error). */
  ready: boolean;
}

const subscribers = new Set<() => void>();
let preloadStarted = false;

const state: CacheState = {
  static: getAllModels(),
  google: null,
  openrouter: null,
  loading: { google: false, openrouter: false },
  errors: {},
  ready: false,
};

function notify() {
  for (const cb of subscribers) cb();
}

function recomputeReady() {
  // Ready when nothing is loading. Providers without API keys never enter loading.
  state.ready = !state.loading.google && !state.loading.openrouter;
}

/**
 * Kick off background fetches for live model lists.
 * Idempotent: subsequent calls are no-ops.
 */
export function preloadModelCache(): void {
  if (preloadStarted) return;
  preloadStarted = true;

  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (geminiKey) {
    state.loading.google = true;
    fetchGeminiModels(geminiKey)
      .then((models) => {
        state.google = models;
      })
      .catch((err: unknown) => {
        state.errors.google = err instanceof Error ? err.message : String(err);
      })
      .finally(() => {
        state.loading.google = false;
        recomputeReady();
        notify();
      });
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    state.loading.openrouter = true;
    fetchOpenRouterModels(openrouterKey)
      .then((models) => {
        state.openrouter = models;
      })
      .catch((err: unknown) => {
        state.errors.openrouter = err instanceof Error ? err.message : String(err);
      })
      .finally(() => {
        state.loading.openrouter = false;
        recomputeReady();
        notify();
      });
  }

  // If neither provider has a key, ready is already true.
  recomputeReady();
}

/** Synchronous read of the current cache state. */
export function getCachedModels(): CacheState {
  return state;
}

/** True once all configured remote fetches have finished. */
export function isCacheReady(): boolean {
  return state.ready;
}

/**
 * Subscribe to cache updates. Returns an unsubscribe function.
 * Callback fires after each remote fetch resolves (success or failure).
 */
export function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/**
 * Returns a flat list of `{ id, name }` for the given provider, merging the
 * static registry with any live-fetched models.
 */
export function getModelsForProvider(provider: string): ModelInfo[] {
  const staticForProvider = state.static.filter((m) => m.provider === provider);

  if (provider === 'google' && state.google) {
    return state.google.map((m) => ({ ...m }));
  }
  if (provider === 'openrouter' && state.openrouter) {
    return state.openrouter.map((m) => ({ ...m }));
  }

  return staticForProvider.map((m) => ({ id: m.id, name: m.name, default: m.default }));
}

/** True if the given remote provider is mid-fetch. */
export function isProviderLoading(provider: string): boolean {
  if (provider === 'google') return state.loading.google;
  if (provider === 'openrouter') return state.loading.openrouter;
  return false;
}

/** Provider error message if the last fetch failed, else undefined. */
export function getProviderError(provider: string): string | undefined {
  if (provider === 'google') return state.errors.google;
  if (provider === 'openrouter') return state.errors.openrouter;
  return undefined;
}
