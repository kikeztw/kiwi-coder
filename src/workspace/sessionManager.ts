import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  rmSync,
} from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { UIMessage } from 'ai';

// ─── Directory constants ───────────────────────────────────────────────────
export const KIWI_DIR = '.kiwi';
export const SESSIONS_DIR = '.kiwi/sessions';
export const SESSIONS_INDEX_FILE = '.kiwi/sessions/sessions.json';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SessionModel {
  provider: string;
  model: string;
  modelId: string;
  name: string;
}

/** Metadata stored in session_[id]/session.json — NO messages */
export interface PersistedSession {
  id: string;
  created: string;
  lastActive: string;
  projectPath: string;
  model: SessionModel;
  agent: string;
  messageCount: number;
  metadata?: {
    description?: string;
    tags?: string[];
  };
}

/** Entry stored in sessions.json index */
export interface SessionInfo {
  id: string;
  created: string;
  lastActive: string;
  messageCount: number;
  description?: string;
}

/** Top-level sessions.json shape */
interface SessionIndex {
  activeSessionId: string | null;
  sessions: SessionInfo[];
}

// ─── Path helpers ──────────────────────────────────────────────────────────

function getSessionsDir(projectPath: string): string {
  return join(projectPath, SESSIONS_DIR);
}

function getSessionDir(projectPath: string, sessionId: string): string {
  return join(projectPath, SESSIONS_DIR, `session_${sessionId}`);
}

function getSessionMetaPath(projectPath: string, sessionId: string): string {
  return join(getSessionDir(projectPath, sessionId), 'session.json');
}

function getSessionMessagesPath(projectPath: string, sessionId: string): string {
  return join(getSessionDir(projectPath, sessionId), 'messages.json');
}

function getIndexPath(projectPath: string): string {
  return join(projectPath, SESSIONS_INDEX_FILE);
}

// ─── Bootstrap ────────────────────────────────────────────────────────────

/** Creates .kiwi/sessions/ if it doesn't exist. Safe to call multiple times. */
export function ensureKiwiDir(projectPath: string): void {
  const dir = getSessionsDir(projectPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// ─── Session ID ───────────────────────────────────────────────────────────

function generateSessionId(): string {
  return randomBytes(4).toString('hex').slice(0, 7);
}

// ─── Index read/write ─────────────────────────────────────────────────────

function readIndex(projectPath: string): SessionIndex {
  const path = getIndexPath(projectPath);
  if (!existsSync(path)) {
    return { activeSessionId: null, sessions: [] };
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as SessionIndex;
  } catch {
    return { activeSessionId: null, sessions: [] };
  }
}

function writeIndex(projectPath: string, index: SessionIndex): void {
  ensureKiwiDir(projectPath);
  try {
    writeFileSync(getIndexPath(projectPath), JSON.stringify(index, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Failed to write sessions index:', error);
  }
}

function upsertIndexEntry(projectPath: string, meta: PersistedSession): void {
  const index = readIndex(projectPath);
  const entry: SessionInfo = {
    id: meta.id,
    created: meta.created,
    lastActive: meta.lastActive,
    messageCount: meta.messageCount,
    description: meta.metadata?.description,
  };
  const existing = index.sessions.findIndex(s => s.id === meta.id);
  if (existing >= 0) {
    index.sessions[existing] = entry;
  } else {
    index.sessions.push(entry);
  }
  // Keep sorted by lastActive desc
  index.sessions.sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
  );
  writeIndex(projectPath, index);
}

// ─── Session CRUD ─────────────────────────────────────────────────────────

export function createSession(
  projectPath: string,
  model: SessionModel,
  agent: string = 'coder',
  description?: string,
): PersistedSession {
  ensureKiwiDir(projectPath);
  const now = new Date().toISOString();
  const id = generateSessionId();

  const meta: PersistedSession = {
    id,
    created: now,
    lastActive: now,
    projectPath,
    model,
    agent,
    messageCount: 0,
    metadata: description ? { description } : undefined,
  };

  const dir = getSessionDir(projectPath, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(getSessionMetaPath(projectPath, id), JSON.stringify(meta, null, 2), 'utf-8');
  writeFileSync(getSessionMessagesPath(projectPath, id), '[]', 'utf-8');

  upsertIndexEntry(projectPath, meta);
  return meta;
}

export function loadSession(projectPath: string, sessionId: string): PersistedSession | null {
  const path = getSessionMetaPath(projectPath, sessionId);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as PersistedSession;
  } catch {
    return null;
  }
}

export function saveSession(projectPath: string, meta: PersistedSession): void {
  const dir = getSessionDir(projectPath, meta.id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const updated: PersistedSession = { ...meta, lastActive: new Date().toISOString() };
  try {
    writeFileSync(getSessionMetaPath(projectPath, meta.id), JSON.stringify(updated, null, 2), 'utf-8');
    upsertIndexEntry(projectPath, updated);
  } catch (error) {
    console.warn('Failed to save session:', error);
  }
}

export function deleteSession(projectPath: string, sessionId: string): boolean {
  const dir = getSessionDir(projectPath, sessionId);
  if (!existsSync(dir)) return false;
  try {
    rmSync(dir, { recursive: true, force: true });
    const index = readIndex(projectPath);
    index.sessions = index.sessions.filter(s => s.id !== sessionId);
    if (index.activeSessionId === sessionId) index.activeSessionId = null;
    writeIndex(projectPath, index);
    return true;
  } catch (error) {
    console.warn('Failed to delete session:', error);
    return false;
  }
}

// ─── Messages ─────────────────────────────────────────────────────────────

export function loadMessages(projectPath: string, sessionId: string): UIMessage[] {
  const path = getSessionMessagesPath(projectPath, sessionId);
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as UIMessage[];
  } catch {
    return [];
  }
}

export function saveMessages(
  projectPath: string,
  sessionId: string,
  messages: UIMessage[],
): void {
  const path = getSessionMessagesPath(projectPath, sessionId);
  try {
    writeFileSync(path, JSON.stringify(messages, null, 2), 'utf-8');
    // Update messageCount in meta + index
    const meta = loadSession(projectPath, sessionId);
    if (meta) {
      saveSession(projectPath, { ...meta, messageCount: messages.length });
    }
  } catch (error) {
    console.warn('Failed to save messages:', error);
  }
}

// ─── Active session ────────────────────────────────────────────────────────

export function getActiveSessionId(projectPath: string): string | null {
  return readIndex(projectPath).activeSessionId;
}

export function setActiveSession(projectPath: string, sessionId: string): void {
  const index = readIndex(projectPath);
  index.activeSessionId = sessionId;
  writeIndex(projectPath, index);
}

export function loadActiveSession(projectPath: string): PersistedSession | null {
  const id = getActiveSessionId(projectPath);
  if (!id) return null;
  return loadSession(projectPath, id);
}

// ─── List ─────────────────────────────────────────────────────────────────

export function listSessions(projectPath: string): SessionInfo[] {
  const index = readIndex(projectPath);
  // Re-sync with filesystem in case dirs were added/removed manually
  const sessionsDir = getSessionsDir(projectPath);
  if (!existsSync(sessionsDir)) return [];

  const dirNames = readdirSync(sessionsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('session_'))
    .map(d => d.name.replace('session_', ''));

  // Filter index to only existing dirs, then sort by lastActive desc
  return index.sessions
    .filter(s => dirNames.includes(s.id))
    .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
}

// ─── Update model ──────────────────────────────────────────────────────────

export function updateSessionModel(
  projectPath: string,
  sessionId: string,
  provider: string,
  model: string,
  modelId: string,
  name: string,
): PersistedSession {
  const meta = loadSession(projectPath, sessionId);
  if (!meta) throw new Error(`Session ${sessionId} not found`);
  const updated: PersistedSession = { ...meta, model: { provider, model, modelId, name } };
  saveSession(projectPath, updated);
  return updated;
}

// ─── Convenience: save active session shortcut ────────────────────────────

/** @deprecated Use saveSession + setActiveSession separately */
export function saveActiveSession(projectPath: string, session: PersistedSession): void {
  saveSession(projectPath, session);
  setActiveSession(projectPath, session.id);
}
