import {
  getAvailableProviders,
  getAvailableModels,
  getProviderInfo,
  getDefaultModel,
  type ModelInfo,
} from '../providers/index.js';
import type { CommandContext } from '../types/index.js';

export interface ProviderContext extends CommandContext {
  currentProvider: string;
  currentModel: string;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
}

export async function providerHandler(
  args: string[],
  context: ProviderContext
): Promise<string> {
  const [subCommand] = args;

  // /provider - list available providers
  if (!subCommand) {
    const providers = getAvailableProviders();
    const current = context.currentProvider;
    
    const lines = providers.map(p => {
      const info = getProviderInfo(p);
      const marker = p === current ? '→ ' : '  ';
      return `${marker}${p} (${info?.name})`;
    });
    
    return `Available providers:\n${lines.join('\n')}`;
  }

  // /provider <name> - switch provider
  const providerName = subCommand.toLowerCase();
  const providerInfo = getProviderInfo(providerName);
  
  if (!providerInfo) {
    const available = getAvailableProviders().join(', ');
    return `Unknown provider: ${providerName}. Available: ${available}`;
  }

  // Check API key
  const apiKey = process.env[providerInfo.envKey];
  if (!apiKey) {
    return `Cannot switch to ${providerName}: ${providerInfo.envKey} environment variable not set`;
  }

  // Get default model for this provider
  const defaultModel = getDefaultModel(providerName);
  if (!defaultModel) {
    return `No models available for provider: ${providerName}`;
  }

  // Update context
  context.setProvider(providerName);
  context.setModel(defaultModel);

  return `Switched to ${providerInfo.name} with model: ${defaultModel}`;
}

export async function modelHandler(
  args: string[],
  context: ProviderContext
): Promise<string> {
  const [subCommand] = args;

  // /model - list available models for current provider
  if (!subCommand) {
    const models = getAvailableModels(context.currentProvider);
    const current = context.currentModel;
    
    const lines = models.map((m: ModelInfo) => {
      const marker = m.id === current ? '→ ' : '  ';
      const defaultMark = m.default ? ' [default]' : '';
      return `${marker}${m.id} (${m.name})${defaultMark}`;
    });
    
    return `Available models for ${context.currentProvider}:\n${lines.join('\n')}`;
  }

  // /model <name> - switch model
  const modelName = subCommand;
  
  // Validate model exists for current provider
  const models = getAvailableModels(context.currentProvider);
  const modelExists = models.some((m: ModelInfo) => m.id === modelName);
  
  if (!modelExists) {
    const available = models.map((m: ModelInfo) => m.id).join(', ');
    return `Unknown model: ${modelName} for ${context.currentProvider}. Available: ${available}`;
  }

  // Update context
  context.setModel(modelName);

  const modelInfo = models.find((m: ModelInfo) => m.id === modelName);
  return `Switched to model: ${modelInfo?.name || modelName}`;
}
