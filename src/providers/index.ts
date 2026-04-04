import { config as dotenvConfig } from 'dotenv';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { logDebug } from '../cli/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (not CWD) - for backward compatibility
const envPath = join(__dirname, '../../.env');
logDebug(`Looking for .env at: ${envPath}`);
logDebug(`__dirname: ${__dirname}`);
logDebug(`File exists: ${existsSync(envPath)}`);
if (existsSync(envPath)) {
  logDebug(`Loading .env from: ${envPath}`);
  dotenvConfig({ path: envPath });
  logDebug(`ANTHROPIC_API_KEY loaded: ${process.env.ANTHROPIC_API_KEY ? 'YES' : 'NO'}`);
} else {
  logDebug('.env not found at project root');
}

// Also try CWD as fallback for development
const cwdEnvPath = join(process.cwd(), '.env');
logDebug(`CWD .env path: ${cwdEnvPath}`);
logDebug(`CWD file exists: ${existsSync(cwdEnvPath)}`);
if (existsSync(cwdEnvPath) && envPath !== cwdEnvPath) {
  logDebug(`Loading .env from CWD: ${cwdEnvPath}`);
  dotenvConfig({ path: cwdEnvPath });
}

// Helper to get API key from environment variables
function getApiKey(provider: string): string | undefined {
  const providerInfo = modelRegistry.providers[provider.toLowerCase()];
  return providerInfo ? process.env[providerInfo.envKey] : undefined;
}

// Load model registry
const modelsPath = join(__dirname, '../../config/models.json');
const modelRegistry = JSON.parse(readFileSync(modelsPath, 'utf-8'));

export interface ModelInfo {
  id: string;
  name: string;
  default?: boolean;
}

export interface ProviderInfo {
  name: string;
  models: ModelInfo[];
  envKey: string;
}

export interface ModelRegistry {
  providers: Record<string, ProviderInfo>;
}

export function getAvailableProviders(): string[] {
  return Object.keys(modelRegistry.providers);
}

export function getAvailableModels(provider: string): ModelInfo[] {
  const providerInfo = modelRegistry.providers[provider.toLowerCase()];
  return providerInfo?.models || [];
}

export function validateProviderModel(provider: string, model: string): { valid: boolean; error?: string } {
  const providerInfo = modelRegistry.providers[provider.toLowerCase()];
  
  if (!providerInfo) {
    return { valid: false, error: `Unknown provider: ${provider}. Available: ${getAvailableProviders().join(', ')}` };
  }

  const modelExists = providerInfo.models.some((m: ModelInfo) => m.id === model);
  if (!modelExists) {
    const available = providerInfo.models.map((m: ModelInfo) => m.id).join(', ');
    return { valid: false, error: `Unknown model: ${model} for ${provider}. Available: ${available}` };
  }

  // Check API key
  const apiKey = process.env[providerInfo.envKey];
  if (!apiKey) {
    return { valid: false, error: `Missing API key: ${providerInfo.envKey} environment variable not set` };
  }

  return { valid: true };
}

export function getDefaultModel(provider: string): string | undefined {
  const providerInfo = modelRegistry.providers[provider.toLowerCase()];
  const defaultModel = providerInfo?.models.find((m: ModelInfo) => m.default);
  return defaultModel?.id || providerInfo?.models[0]?.id;
}

export function getAllModels(): Array<ModelInfo & { provider: string }> {
  const allModels: Array<ModelInfo & { provider: string }> = [];
  
  for (const [providerKey, providerInfo] of Object.entries(modelRegistry.providers) as [string, ProviderInfo][]) {
    for (const model of providerInfo.models) {
      allModels.push({
        ...model,
        provider: providerKey,
      });
    }
  }
  
  return allModels;
}

export function parseModelId(modelId: string): { provider: string; model: string } | null {
  const parts = modelId.split('/');
  if (parts.length !== 2) return null;
  return { provider: parts[0], model: parts[1] };
}

export function getProviderForModel(modelId: string): string | undefined {
  const allModels = getAllModels();
  const found = allModels.find(m => m.id === modelId);
  return found?.provider;
}

export function validateModel(modelId: string): { valid: boolean; error?: string; provider?: string; modelName?: string } {
  const parsed = parseModelId(modelId);
  if (!parsed) {
    return { valid: false, error: `Invalid model format: ${modelId}. Use format: provider/model-name` };
  }
  
  const providerInfo = modelRegistry.providers[parsed.provider.toLowerCase()];
  if (!providerInfo) {
    return { valid: false, error: `Unknown provider: ${parsed.provider}` };
  }
  
  const modelExists = providerInfo.models.some((m: ModelInfo) => m.id === modelId);
  if (!modelExists) {
    return { valid: false, error: `Unknown model: ${modelId}` };
  }
  
  // Check API key from config or env
  const apiKey = getApiKey(parsed.provider);
  if (!apiKey) {
    return { valid: false, error: `Missing API key for ${parsed.provider}. Set ${parsed.provider.toUpperCase()}_API_KEY in your .env file.` };
  }
  
  return { valid: true, provider: parsed.provider, modelName: parsed.model };
}

export function getModel(provider: string, modelName: string): LanguageModel {
  const apiKey = getApiKey(provider);
  
  if (!apiKey) {
    throw new Error(`Missing API key for ${provider}. Set ${provider.toUpperCase()}_API_KEY in your .env file.`);
  }
  
  switch (provider.toLowerCase()) {
    case 'openai': {
      const openai = createOpenAI({ apiKey });
      return openai(modelName);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelName);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
