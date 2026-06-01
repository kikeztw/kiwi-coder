import type { UIMessage } from 'ai';
import { EventTypes } from '../../domain/events/EventTypes.js';
import type { IMessageRepository } from '../../domain/repositories/IMessageRepository.js';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import type { IEventBus } from '../ports/IEventBus.js';

export type SendMessageInput = {
  sessionId: string;
  message: UIMessage;
};

export class SendMessage {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly messages: IMessageRepository,
    private readonly eventBus: IEventBus,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: SendMessageInput): Promise<UIMessage[]> {
    const sessionId = SessionId.create(input.sessionId);
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new Error(`Session ${input.sessionId} not found`);
    }

    const existingMessages = await this.messages.load(sessionId);
    const nextMessages = [...existingMessages, input.message];

    await this.messages.save(sessionId, nextMessages);
    await this.sessions.save(session.withMessageCount(nextMessages.length, this.now()));
    await this.eventBus.publish({
      id: `message-sent-${input.message.id}`,
      type: EventTypes.MESSAGE_SENT,
      occurredAt: this.now(),
      payload: {
        sessionId: input.sessionId,
        messageId: input.message.id,
      },
    });

    return nextMessages;
  }
}
