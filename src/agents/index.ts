import { agentRegistry } from './registry.js';
import { coderAgent } from './coder.js';
import { planAgent } from './plan.js';

// Register all agents
agentRegistry.register(coderAgent);
agentRegistry.register(planAgent);

export { agentRegistry };
export { coderAgent } from './coder.js';
export { planAgent } from './plan.js';
