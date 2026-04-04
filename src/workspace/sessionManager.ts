import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { Message } from '../cli/hooks/useMessages.js';

export const SESSIONS_DIR = '.kiwi/sessions';

export interface PersistedSession {
  id: string;
  created: string;
  lastActive: string;
  projectPath: string;
  model: {
    provider: string;
    model: string;
    modelId: string;
    name: string;
  };
  agent: string;
  messages: Message[];
  messageCount: number;
  metadata?: {
    tags?: string[];
    description?: string;
  };
}

export interface SessionInfo {
  id: string;
  created: string;
  lastActive: string;
  messageCount: number;
  description?: string;
}

function getSessionsDir(projectPath: string): string {
  return join(projectPath, SESSIONS_DIR);
}

function ensureSessionsDir(projectPath: string): void {
  const dir = getSessionsDir(projectPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function generateSessionId(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return `session-${date}-${time}`;
}

function getSessionPath(projectPath: string, sessionId: string): string {
  return join(getSessionsDir(projectPath), `${sessionId}.json`);
}

export function listSessions(projectPath: string): SessionInfo[] {
  const dir = getSessionsDir(projectPath);
  if (!existsSync(dir)) {
    return [];
  }

  const files = readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const path = join(dir, f);
      try {
        const content = readFileSync(path, 'utf-8');
        const session = JSON.parse(content) as PersistedSession;
        return {
          id: session.id,
          created: session.created,
          lastActive: session.lastActive,
          messageCount: session.messageCount,
          description: session.metadata?.description,
        };
      } catch {
        return null;
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

  return files;
}

export function getLastActiveSession(projectPath: string): SessionInfo | null {
  const sessions = listSessions(projectPath);
  return sessions.length > 0 ? sessions[0] : null;
}

export function loadSession(projectPath: string, sessionId: string): PersistedSession | null {
  const path = getSessionPath(projectPath, sessionId);
  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, 'utf-8');
    const session = JSON.parse(content) as PersistedSession;
    return session;
  } catch (error) {
    console.warn('Failed to load session:', error);
    return null;
  }
}

export function saveSession(projectPath: string, session: PersistedSession): void {
  ensureSessionsDir(projectPath);
  const path = getSessionPath(projectPath, session.id);
  
  const updatedSession: PersistedSession = {
    ...session,
    lastActive: new Date().toISOString(),
    messageCount: session.messages.length,
  };

  try {
    writeFileSync(path, JSON.stringify(updatedSession, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Failed to save session:', error);
  }
}

export function createSession(
  projectPath: string,
  model: { provider: string; model: string; modelId: string; name: string },
  agent: string = 'coder',
  description?: string
): PersistedSession {
  const now = new Date().toISOString();
  const session: PersistedSession = {
    id: generateSessionId(),
    created: now,
    lastActive: now,
    projectPath,
    model,
    agent,
    messages: [],
    messageCount: 0,
    metadata: description ? { description } : undefined,
  };

  saveSession(projectPath, session);
  return session;
}

export function deleteSession(projectPath: string, sessionId: string): boolean {
  const path = getSessionPath(projectPath, sessionId);
  if (!existsSync(path)) {
    return false;
  }

  try {
    unlinkSync(path);
    return true;
  } catch (error) {
    console.warn('Failed to delete session:', error);
    return false;
  }
}

export function cleanupOldSessions(projectPath: string, maxSessions: number = 100): void {
  const sessions = listSessions(projectPath);
  if (sessions.length <= maxSessions) {
    return;
  }

  // Keep most recent maxSessions
  const toDelete = sessions.slice(maxSessions);
  for (const session of toDelete) {
    deleteSession(projectPath, session.id);
  }
}
