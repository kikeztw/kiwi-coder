import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

export const KIWI_DIR = '.kiwi';
export const WORKSPACE_CONFIG_FILENAME = 'config';

// Full path to config file (e.g., .kiwi/config)
export function getConfigPath(projectPath: string): string {
  return join(projectPath, KIWI_DIR, WORKSPACE_CONFIG_FILENAME);
}

// Ensure .kiwi directory exists
export function ensureKiwiDir(projectPath: string): void {
  const kiwiDir = join(projectPath, KIWI_DIR);
  if (!existsSync(kiwiDir)) {
    mkdirSync(kiwiDir, { recursive: true });
  }
}

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

const OLD_CONFIG_FILENAME = '.kiwi.json';

function migrateOldConfig(projectPath: string): WorkspaceConfig | null {
  const oldPath = join(projectPath, OLD_CONFIG_FILENAME);
  if (!existsSync(oldPath)) {
    return null;
  }
  
  try {
    const content = readFileSync(oldPath, 'utf-8');
    const parsed = JSON.parse(content) as WorkspaceConfig;
    
    // Migrate to new location
    ensureKiwiDir(projectPath);
    saveWorkspaceConfig(projectPath, parsed);
    
    // Remove old config file
    try {
      unlinkSync(oldPath);
    } catch {
      // Ignore deletion errors
    }
    
    return parsed;
  } catch {
    return null;
  }
}

export function loadWorkspaceConfig(projectPath: string): WorkspaceConfig {
  const configPath = getConfigPath(projectPath);
  
  // Check for new config first
  if (!existsSync(configPath)) {
    // Try to migrate old config if it exists
    const migratedConfig = migrateOldConfig(projectPath);
    if (migratedConfig) {
      // Validate and update projectPath if needed
      if (migratedConfig.projectPath !== projectPath) {
        migratedConfig.projectPath = projectPath;
        migratedConfig.lastUpdated = new Date().toISOString();
        saveWorkspaceConfig(projectPath, migratedConfig);
      }
      return migratedConfig;
    }
    
    // No config exists, create default
    ensureKiwiDir(projectPath);
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
    
    // Validate projectPath - update if different
    if (parsed.projectPath !== projectPath) {
      parsed.projectPath = projectPath;
      parsed.lastUpdated = new Date().toISOString();
      saveWorkspaceConfig(projectPath, parsed);
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
  ensureKiwiDir(projectPath);
  const configPath = getConfigPath(projectPath);
  
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
