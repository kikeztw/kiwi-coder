import type {
  CreateSessionInput,
  ISessionRepository,
} from '../../domain/repositories/ISessionRepository.js';
import { Session } from '../../domain/entities/Session.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import {
  createSession,
  deleteSession,
  listSessions,
  loadActiveSession,
  loadSession,
  saveSession,
  setActiveSession,
  updateSessionModel,
} from '../../workspace/sessionManager.js';
import {
  domainModelToSessionModel,
  persistedSessionToDomain,
} from '../mappers/sessionPersistenceMapper.js';

export class FileSessionRepository implements ISessionRepository {
  constructor(private readonly projectPath: string) {}

  async create(input: CreateSessionInput): Promise<Session> {
    const session = createSession(
      input.projectPath,
      domainModelToSessionModel(input.model),
      input.agent,
      input.description,
    );
    return persistedSessionToDomain(session);
  }

  async findById(id: SessionId): Promise<Session | null> {
    const session = loadSession(this.projectPath, id.toString());
    return session ? persistedSessionToDomain(session) : null;
  }

  async findActive(): Promise<Session | null> {
    const session = loadActiveSession(this.projectPath);
    return session ? persistedSessionToDomain(session) : null;
  }

  async setActive(id: SessionId): Promise<void> {
    setActiveSession(this.projectPath, id.toString());
  }

  async list(): Promise<Session[]> {
    return listSessions(this.projectPath)
      .map((session) => loadSession(this.projectPath, session.id))
      .filter((session) => session !== null)
      .map((session) => persistedSessionToDomain(session));
  }

  async save(session: Session): Promise<void> {
    updateSessionModel(
      this.projectPath,
      session.id.toString(),
      session.model.provider,
      session.model.model,
      session.model.id.toString(),
      session.model.name,
    );

    const persisted = loadSession(this.projectPath, session.id.toString());
    if (!persisted) {
      throw new Error(`Session ${session.id.toString()} not found`);
    }

    saveSession(this.projectPath, {
      ...persisted,
      agent: session.agent,
      messageCount: session.messageCount,
      metadata: session.metadata,
    });
  }

  async delete(id: SessionId): Promise<boolean> {
    return deleteSession(this.projectPath, id.toString());
  }
}
