import { Session } from '../../domain/entities/Session.js';
import type { SessionDTO } from '../dto/SessionDTO.js';
import { modelToDTO } from './modelMapper.js';

export function sessionToDTO(session: Session): SessionDTO {
  return {
    id: session.id.toString(),
    created: session.created.toISOString(),
    lastActive: session.lastActive.toISOString(),
    projectPath: session.projectPath,
    model: modelToDTO(session.model),
    agent: session.agent,
    messageCount: session.messageCount,
    status: session.status,
    description: session.metadata?.description,
  };
}
