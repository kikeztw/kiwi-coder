import { MessageApplicationService, SessionApplicationService } from '../application/index.js';
import { FileChatHistoryStore } from './chat-history/FileChatHistoryStore.js';
import { EventEmitterBus } from './event-bus/EventEmitterBus.js';
import { FileSessionRepository } from './repositories/FileSessionRepository.js';

export type ApplicationServices = {
  eventBus: EventEmitterBus;
  messages: MessageApplicationService;
  sessions: SessionApplicationService;
};

export function createApplicationServices(projectPath: string): ApplicationServices {
  const eventBus = new EventEmitterBus();
  const chatHistoryStore = new FileChatHistoryStore(projectPath);
  const sessionRepository = new FileSessionRepository(projectPath);

  return {
    eventBus,
    messages: new MessageApplicationService(chatHistoryStore),
    sessions: new SessionApplicationService(sessionRepository, eventBus),
  };
}
