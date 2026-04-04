import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const LOG_DIR = join(homedir(), '.kiwi', 'logs');
const LOG_FILE = join(LOG_DIR, `kiwi-${new Date().toISOString().split('T')[0]}.log`);

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

export function logDebug(message: string): void {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  
  // Write to file
  try {
    appendFileSync(LOG_FILE, logLine);
  } catch (err) {
    // Silent fail - can't log the logging error
  }
  
  // Also log to console for development
  console.log(`[DEBUG] ${message}`);
}

export function logError(error: Error | string): void {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? `${error.name}: ${error.message}` : error;
  const logLine = `[${timestamp}] [ERROR] ${message}\n`;
  
  if (error instanceof Error && error.stack) {
    logLine + `Stack: ${error.stack}\n`;
  }
  
  try {
    appendFileSync(LOG_FILE, logLine);
  } catch {
    // Silent fail
  }
  
  console.error(`[ERROR] ${message}`);
}

export function getLogFilePath(): string {
  return LOG_FILE;
}
