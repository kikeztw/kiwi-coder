import {
  getAllModels,
  validateModel,
  parseModelId,
  type ModelInfo,
} from '../providers/index.js';
import type { CommandContext } from '../types/index.js';

export interface ModelContext extends CommandContext {
  currentProvider: string;
  currentModel: string;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
}

export async function modelHandler(
  args: string[],
  context: ModelContext
): Promise<string> {
  const [subCommand] = args;

  // /model - list all available models from all providers
  if (!subCommand) {
    const allModels = getAllModels();
    const currentFullModel = `${context.currentProvider}/${context.currentModel}`;
    
    const lines = allModels.map((m: ModelInfo & { provider: string }) => {
      const marker = m.id === currentFullModel ? '→ ' : '  ';
      const defaultMark = m.default ? ' [default]' : '';
      return `${marker}${m.id} (${m.name})${defaultMark}`;
    });
    
    return `Available models:\n${lines.join('\n')}`;
  }

  // /model <provider/model> - switch to specific model (auto-detects provider)
  const modelId = subCommand;
  
  const validation = validateModel(modelId);
  if (!validation.valid) {
    return `Cannot switch: ${validation.error}`;
  }

  // Parse provider and model from the ID
  const parsed = parseModelId(modelId);
  if (!parsed) {
    return `Invalid model format: ${modelId}`;
  }

  // Update both provider and model
  context.setProvider(parsed.provider);
  context.setModel(parsed.model);

  const allModels = getAllModels();
  const modelInfo = allModels.find((m: ModelInfo & { provider: string }) => m.id === modelId);
  
  return `Switched to ${modelInfo?.name || modelId}`;
}
