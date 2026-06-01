import { Model } from '../../domain/entities/Model.js';
import { Session } from '../../domain/entities/Session.js';
import { ModelId } from '../../domain/value-objects/ModelId.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import type { PersistedSession, SessionModel } from '../../workspace/sessionManager.js';

export function domainModelToSessionModel(model: Model): SessionModel {
  return {
    provider: model.provider,
    model: model.model,
    modelId: model.id.toString(),
    name: model.name,
  };
}

export function persistedSessionToDomain(session: PersistedSession): Session {
  const model = Model.create({
    id: ModelId.create(session.model.modelId),
    provider: session.model.provider,
    model: session.model.model,
    name: session.model.name,
  });

  return Session.create({
    id: SessionId.create(session.id),
    created: new Date(session.created),
    lastActive: new Date(session.lastActive),
    projectPath: session.projectPath,
    model,
    agent: session.agent,
    messageCount: session.messageCount,
    metadata: session.metadata,
  });
}
