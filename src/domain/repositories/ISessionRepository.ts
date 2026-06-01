import { Session } from '../entities/Session.js';
import { Model } from '../entities/Model.js';
import { SessionId } from '../value-objects/SessionId.js';

export type CreateSessionInput = {
  projectPath: string;
  model: Model;
  agent: string;
  description?: string;
};

export interface ISessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findById(id: SessionId): Promise<Session | null>;
  findActive(): Promise<Session | null>;
  setActive(id: SessionId): Promise<void>;
  list(): Promise<Session[]>;
  save(session: Session): Promise<void>;
  delete(id: SessionId): Promise<boolean>;
}
