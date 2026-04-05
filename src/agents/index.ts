import { agentRegistry } from './registry.js';
import { coderAgent } from './coder.js';
import { planAgent } from './plan.js';

// Register all agents
agentRegistry.register(coderAgent);
agentRegistry.register(planAgent);

export { agentRegistry };

// Export classes
export { CoderAgent } from './coder.js';
export { PlanAgent } from './plan.js';

// Export singleton instances
export { coderAgent } from './coder.js';
export { planAgent } from './plan.js';
