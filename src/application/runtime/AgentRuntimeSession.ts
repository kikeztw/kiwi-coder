export type AgentRuntimeSession = {
  id: string;
  projectPath: string;
  agent: string;
  model: {
    id: string;
    provider: string;
    name: string;
    displayName: string;
  };
};
