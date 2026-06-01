import type { ModelDTO } from './ModelDTO.js';

export type SessionDTO = {
  id: string;
  created: string;
  lastActive: string;
  projectPath: string;
  model: ModelDTO;
  agent: string;
  messageCount: number;
  status: string;
  description?: string;
};
