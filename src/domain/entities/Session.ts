import { Model } from './Model.js';
import { SessionId } from '../value-objects/SessionId.js';

export type SessionStatus = 'idle' | 'thinking' | 'acting' | 'reviewing' | 'error';

export type SessionProps = {
  id: SessionId;
  created: Date;
  lastActive: Date;
  projectPath: string;
  model: Model;
  agent: string;
  messageCount: number;
  status?: SessionStatus;
  metadata?: {
    description?: string;
    tags?: string[];
  };
};

export class Session {
  private constructor(private readonly props: SessionProps) {}

  static create(props: SessionProps): Session {
    if (!props.projectPath.trim()) {
      throw new Error('Session projectPath cannot be empty');
    }
    if (!props.agent.trim()) {
      throw new Error('Session agent cannot be empty');
    }
    if (props.messageCount < 0) {
      throw new Error('Session messageCount cannot be negative');
    }
    return new Session({ ...props, status: props.status ?? 'idle' });
  }

  get id(): SessionId {
    return this.props.id;
  }

  get created(): Date {
    return this.props.created;
  }

  get lastActive(): Date {
    return this.props.lastActive;
  }

  get projectPath(): string {
    return this.props.projectPath;
  }

  get model(): Model {
    return this.props.model;
  }

  get agent(): string {
    return this.props.agent;
  }

  get messageCount(): number {
    return this.props.messageCount;
  }

  get status(): SessionStatus {
    return this.props.status ?? 'idle';
  }

  get metadata(): SessionProps['metadata'] {
    return this.props.metadata;
  }

  changeModel(model: Model, lastActive: Date): Session {
    return Session.create({ ...this.props, model, lastActive });
  }

  changeAgent(agent: string, lastActive: Date): Session {
    return Session.create({ ...this.props, agent, lastActive });
  }

  withMessageCount(messageCount: number, lastActive: Date): Session {
    return Session.create({ ...this.props, messageCount, lastActive });
  }

  withStatus(status: SessionStatus): Session {
    return Session.create({ ...this.props, status });
  }
}
