import { tool } from 'ai';
import { z } from 'zod';
import { getProjectPath } from '../shared/context.js';
import { runGit } from './runGit.js';

export const gitCheckout = tool({
  title: 'Git Checkout',
  description: 'Switch to a branch or restore working tree files from a ref.',
  inputSchema: z.object({
    target: z.string().min(1).describe('Branch name, commit hash or tag to check out'),
  }),
  needsApproval: true,
  execute: async ({ target }, options) => {
    const projectPath = getProjectPath(options);

    const result = await runGit(['checkout', target], projectPath);
    if (!result.success) {
      throw new Error(`git checkout failed: ${result.stderr}`);
    }
    return { success: true, target };
  },
});
