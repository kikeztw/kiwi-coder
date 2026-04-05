import * as path from 'path';

// Files and directories that should be blocked from access
const BLOCKED_PATTERNS = [
  '.kiwi',
  '.kiwi/',
  '.gitignore',
  '.env',
  '.env.',
];

// Check if a file/directory name is blocked
export function isBlockedFileName(name: string): boolean {
  for (const blocked of BLOCKED_PATTERNS) {
    if (name === blocked || name.startsWith(blocked)) {
      return true;
    }
  }
  // Check for .env files specifically
  if (name.startsWith('.env')) {
    return true;
  }
  return false;
}

function containsBlockedPattern(resolvedPath: string): boolean {
  const normalizedPath = path.normalize(resolvedPath);
  const pathParts = normalizedPath.split(path.sep);
  
  // Check each part of the path against blocked patterns
  for (const part of pathParts) {
    for (const blocked of BLOCKED_PATTERNS) {
      // Exact match for directories/files
      if (part === blocked || part.startsWith(blocked)) {
        return true;
      }
    }
    // Check for .env files specifically
    if (part.startsWith('.env')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Resolve a potentially relative path against the project path
 * Returns the absolute path
 */
export function resolvePath(inputPath: string, projectPath: string): string {
  // If already absolute, normalize it
  if (path.isAbsolute(inputPath)) {
    return path.normalize(inputPath);
  }
  
  // Resolve relative path against project path
  return path.resolve(projectPath, inputPath);
}

/**
 * Validate that a resolved path is within the project directory
 * Throws an error if the path is outside the project or contains blocked patterns
 */
export function validatePath(resolvedPath: string, projectPath: string): void {
  const normalizedResolved = path.normalize(resolvedPath);
  const normalizedProject = path.normalize(projectPath);
  
  // Ensure the resolved path starts with the project path
  // This prevents path traversal attacks like ../../../etc/passwd
  if (!normalizedResolved.startsWith(normalizedProject)) {
    throw new Error(
      `Access denied: Path "${resolvedPath}" is outside the project directory "${projectPath}"`
    );
  }
  
  // Check for blocked patterns
  if (containsBlockedPattern(normalizedResolved)) {
    throw new Error(
      `Access denied: Path "${resolvedPath}" contains protected files/directories (.kiwi, .env, .gitignore)`
    );
  }
}

/**
 * Convenience function to resolve and validate in one step
 */
export function resolveAndValidatePath(inputPath: string, projectPath: string): string {
  const resolved = resolvePath(inputPath, projectPath);
  validatePath(resolved, projectPath);
  return resolved;
}

/**
 * Type for tool context
 */
export interface ToolContext {
  experimental_context: {
    projectPath: string;
  };
}
