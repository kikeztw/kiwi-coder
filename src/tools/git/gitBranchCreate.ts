import { tool } from 'ai';
import { z } from 'zod';
import { getProjectPath } from '../shared/context.js';
import { runGit } from './runGit.js';

export const gitBranchCreate = tool({
  title: 'Git Branch Create',
  description: 'Create a new branch. Optionally check it out immediately.',
  inputSchema: z.object({
    name: z.string().min(1).describe('Branch name'),
    checkout: z
      .boolean()
      .optional()
      .default(false)
      .describe('Switch to the new branch after creating it'),
    startPoint: z
      .string()
      .optional()
      .describe('Optional starting commit, branch or tag (default: current HEAD)'),
  }),
  needsApproval: true,
  execute: async ({ name, checkout = false, startPoint }, options) => {
    const projectPath = getProjectPath(options);

    const args = checkout ? ['checkout', '-b', name] : ['branch', name];
    if (startPoint) args.push(startPoint);

    const result = await runGit(args, projectPath);
    if (!result.success) {
      throw new Error(`git branch create failed: ${result.stderr}`);
    }
    return { success: true, name, checkedOut: checkout };
  },
});
