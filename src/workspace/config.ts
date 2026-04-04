import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export const WORKSPACE_CONFIG_FILENAME = '.kiwi.json';

export interface ModelConfig {
  provider: string;
  model: string;
  modelId: string;
  name: string;
}

export interface WorkspaceConfig {
  version: string;
  lastUpdated: string;
  model: ModelConfig;
  projectPath: string;
}

const DEFAULT_VERSION = '1.0';

export function getDefaultConfig(projectPath: string): WorkspaceConfig {
  const provider = process.env.MODEL_PROVIDER || 'openai';
  const model = process.env.MODEL_NAME || 'gpt-4o';
  
  return {
    version: DEFAULT_VERSION,
    lastUpdated: new Date().toISOString(),
    model: {
      provider,
      model,
      modelId: `${provider}/${model}`,
      name: model,
    },
    projectPath,
  };
}

export function loadWorkspaceConfig(projectPath: string): WorkspaceConfig {
  const configPath = join(projectPath, WORKSPACE_CONFIG_FILENAME);
  
  if (!existsSync(configPath)) {
    const defaultConfig = getDefaultConfig(projectPath);
    saveWorkspaceConfig(projectPath, defaultConfig);
    return defaultConfig;
  }
  
  try {
    const content = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content) as WorkspaceConfig;
    
    // Validate required fields
    if (!parsed.model || !parsed.model.provider || !parsed.model.model) {
      console.warn('Invalid workspace config, using defaults');
      const defaultConfig = getDefaultConfig(projectPath);
      saveWorkspaceConfig(projectPath, defaultConfig);
      return defaultConfig;
    }
    
    return parsed;
  } catch (error) {
    console.warn('Failed to load workspace config:', error);
    const defaultConfig = getDefaultConfig(projectPath);
    saveWorkspaceConfig(projectPath, defaultConfig);
    return defaultConfig;
  }
}

export function saveWorkspaceConfig(
  projectPath: string,
  config: Partial<WorkspaceConfig>
): void {
  const configPath = join(projectPath, WORKSPACE_CONFIG_FILENAME);
  
  const fullConfig: WorkspaceConfig = {
    version: config.version || DEFAULT_VERSION,
    lastUpdated: new Date().toISOString(),
    model: config.model || getDefaultConfig(projectPath).model,
    projectPath: config.projectPath || projectPath,
  };
  
  try {
    writeFileSync(configPath, JSON.stringify(fullConfig, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Failed to save workspace config:', error);
  }
}

export function updateModelInConfig(
  projectPath: string,
  provider: string,
  model: string,
  modelId: string,
  name: string
): void {
  const existingConfig = loadWorkspaceConfig(projectPath);
  
  saveWorkspaceConfig(projectPath, {
    ...existingConfig,
    model: {
      provider,
      model,
      modelId,
      name,
    },
  });
}
