import { SessionId } from '../value-objects/SessionId.js';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type MessageProps = {
  id: string;
  sessionId: SessionId;
  role: MessageRole;
  createdAt: Date;
};

export class Message {
  private constructor(private readonly props: MessageProps) {}

  static create(props: MessageProps): Message {
    if (!props.id.trim()) {
      throw new Error('Message id cannot be empty');
    }
    return new Message(props);
  }

  get id(): string {
    return this.props.id;
  }

  get sessionId(): SessionId {
    return this.props.sessionId;
  }

  get role(): MessageRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
