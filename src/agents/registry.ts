import type { Agent } from '../types/index.js';

class AgentRegistry {
  private agents: Map<string, Agent> = new Map();
  private currentAgent: string = 'coder';

  register(agent: Agent): void {
    this.agents.set(agent.name, agent);
  }

  get(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  getCurrent(): Agent {
    const agent = this.agents.get(this.currentAgent);
    if (!agent) {
      throw new Error(`Current agent '${this.currentAgent}' not found`);
    }
    return agent;
  }

  getCurrentName(): string {
    return this.currentAgent;
  }

  setCurrent(name: string): boolean {
    if (!this.agents.has(name)) {
      return false;
    }
    this.currentAgent = name;
    return true;
  }

  list(): string[] {
    return Array.from(this.agents.keys());
  }
}

export const agentRegistry = new AgentRegistry();
