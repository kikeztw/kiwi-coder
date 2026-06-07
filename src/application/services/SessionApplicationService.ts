import type { ModelDTO } from '../dto/ModelDTO.js';
import type { SessionDTO } from '../dto/SessionDTO.js';
import type { SessionSummaryDTO } from '../dto/SessionSummaryDTO.js';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import { sessionToDTO } from '../mappers/sessionMapper.js';
import type { IEventBus } from '../ports/IEventBus.js';
import { ChangeModel } from '../use-cases/ChangeModel.js';
import { ChangeAgent } from '../use-cases/ChangeAgent.js';
import { DeleteSession } from '../use-cases/DeleteSession.js';
import { StartSession } from '../use-cases/StartSession.js';

export type InitializeSessionInput = {
  projectPath: string;
  defaultModel: ModelDTO;
  initialAgent: string;
};

export type InitializeSessionResult = {
  currentSession: SessionDTO;
  sessions: SessionSummaryDTO[];
};

export class SessionApplicationService {
  private readonly startSession: StartSession;
  private readonly changeModel: ChangeModel;
  private readonly changeAgent: ChangeAgent;
  private readonly deleteSession: DeleteSession;

  constructor(
    private readonly sessions: ISessionRepository,
    eventBus: IEventBus,
  ) {
    this.startSession = new StartSession(sessions, eventBus);
    this.changeModel = new ChangeModel(sessions, eventBus);
    this.changeAgent = new ChangeAgent(sessions, eventBus);
    this.deleteSession = new DeleteSession(sessions, eventBus);
  }

  async initialize(input: InitializeSessionInput): Promise<InitializeSessionResult> {
    const active = await this.sessions.findActive();
    if (active) {
      return {
        currentSession: sessionToDTO(active),
        sessions: await this.list(),
      };
    }

    const existing = await this.sessions.list();
    if (existing.length > 0) {
      const [mostRecent] = existing;
      await this.sessions.setActive(mostRecent.id);
      return {
        currentSession: sessionToDTO(mostRecent),
        sessions: await this.list(),
      };
    }

    const currentSession = await this.startSession.execute({
      projectPath: input.projectPath,
      model: input.defaultModel,
      agent: input.initialAgent,
    });

    return {
      currentSession,
      sessions: await this.list(),
    };
  }

  async list(): Promise<SessionSummaryDTO[]> {
    const sessions = await this.sessions.list();
    return sessions.map((session) => ({
      id: session.id.toString(),
      created: session.created.toISOString(),
      lastActive: session.lastActive.toISOString(),
      messageCount: session.messageCount,
      description: session.metadata?.description,
    }));
  }

  async select(sessionId: string): Promise<SessionDTO | null> {
    const id = SessionId.create(sessionId);
    const session = await this.sessions.findById(id);
    if (!session) {
      return null;
    }

    await this.sessions.setActive(id);
    return sessionToDTO(session);
  }

  async create(input: {
    projectPath: string;
    model: ModelDTO;
    agent: string;
    description?: string;
  }): Promise<SessionDTO> {
    return this.startSession.execute(input);
  }

  async delete(sessionId: string): Promise<boolean> {
    return this.deleteSession.execute({ sessionId });
  }

  async changeSessionModel(input: {
    sessionId: string;
    model: ModelDTO;
  }): Promise<SessionDTO> {
    return this.changeModel.execute(input);
  }

  async changeSessionAgent(input: {
    sessionId: string;
    agent: string;
  }): Promise<SessionDTO> {
    return this.changeAgent.execute(input);
  }

  async save(session: SessionDTO): Promise<void> {
    const domainSession = await this.sessions.findById(SessionId.create(session.id));
    if (!domainSession) {
      throw new Error(`Session ${session.id} not found`);
    }

    await this.sessions.save(domainSession);
  }
}
