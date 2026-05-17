import * as path from 'path';

// Files and directories that should be blocked from access
const BLOCKED_PATTERNS = [
  '.kiwi',
  '.gitignore',
  '.env',
  '.env.',
];

// Subdirectories within .kiwi that are explicitly allowed
const KIWI_ALLOWED_SUBDIRS = [
  'plan',
];

// Check if a file/directory name is blocked
export function isBlockedFileName(name: string): boolean {
  for (const blocked of BLOCKED_PATTERNS) {
    if (name === blocked || name.startsWith(blocked)) {
      return true;
    }
  }
  if (name.startsWith('.env')) {
    return true;
  }
  return false;
}

function containsBlockedPattern(resolvedPath: string): boolean {
  const normalizedPath = path.normalize(resolvedPath);
  const pathParts = normalizedPath.split(path.sep);

  for (const part of pathParts) {
    for (const blocked of BLOCKED_PATTERNS) {
      if (part === blocked || part.startsWith(blocked)) {
        return true;
      }
    }
    if (part.startsWith('.env')) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a path is within an allowed subdirectory of .kiwi
 */
function isAllowedKiwiSubdir(resolvedPath: string, projectPath: string): boolean {
  const normalizedPath = path.normalize(resolvedPath);
  const normalizedProject = path.normalize(projectPath);
  const relativePath = path.relative(normalizedProject, normalizedPath);
  const pathParts = relativePath.split(path.sep);

  // Check if path is under .kiwi
  const kiwiIndex = pathParts.indexOf('.kiwi');
  if (kiwiIndex === -1) {
    // Not under .kiwi
    return false;
  }

  // If the path is exactly .kiwi, block it
  if (kiwiIndex === 0 && pathParts.length === 1) {
    return false;
  }

  // Get the subdirectory immediately after .kiwi (if exists)
  const subdir = pathParts[kiwiIndex + 1];
  if (!subdir) {
    // Path is .kiwi/ (trailing slash), block it
    return false;
  }

  // Allow if the subdirectory is in the allowed list
  return KIWI_ALLOWED_SUBDIRS.includes(subdir);
}

/**
 * Resolve a potentially relative path against the project path
 */
export function resolvePath(inputPath: string, projectPath: string): string {
  if (path.isAbsolute(inputPath)) {
    return path.normalize(inputPath);
  }
  return path.resolve(projectPath, inputPath);
}

/**
 * Validate that a resolved path is within the project directory and not blocked.
 */
export function validatePath(resolvedPath: string, projectPath: string): void {
  const normalizedResolved = path.normalize(resolvedPath);
  const normalizedProject = path.normalize(projectPath);

  if (!normalizedResolved.startsWith(normalizedProject)) {
    throw new Error(
      `Access denied: Path "${resolvedPath}" is outside the project directory "${projectPath}"`,
    );
  }

  // Check if path is within an allowed .kiwi subdirectory
  if (isAllowedKiwiSubdir(normalizedResolved, normalizedProject)) {
    return; // Allow access to .kiwi/plan, .kiwi/sessions, etc.
  }

  if (containsBlockedPattern(normalizedResolved)) {
    throw new Error(
      `Access denied: Path "${resolvedPath}" contains protected files/directories (.kiwi, .env, .gitignore)`,
    );
  }
}

/**
 * Resolve and validate in one step.
 */
export function resolveAndValidatePath(inputPath: string, projectPath: string): string {
  const resolved = resolvePath(inputPath, projectPath);
  validatePath(resolved, projectPath);
  return resolved;
}
