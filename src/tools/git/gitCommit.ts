import { tool } from 'ai';
import { z } from 'zod';
import { getProjectPath } from '../shared/context.js';
import { runGit } from './runGit.js';

export const gitCommit = tool({
  title: 'Git Commit',
  description:
    'Create a commit with the staged changes. The message is required. Use amend=true to amend the previous commit.',
  inputSchema: z.object({
    message: z.string().min(1).describe('Commit message'),
    amend: z.boolean().optional().default(false).describe('Amend the previous commit'),
  }),
  needsApproval: true,
  execute: async ({ message, amend = false }, options) => {
    const projectPath = getProjectPath(options);

    const args = ['commit', '-m', message];
    if (amend) args.push('--amend');

    const result = await runGit(args, projectPath);
    if (!result.success) {
      throw new Error(`git commit failed: ${result.stderr || result.stdout}`);
    }

    const hashResult = await runGit(['rev-parse', 'HEAD'], projectPath);
    return {
      success: true,
      message,
      amended: amend,
      hash: hashResult.success ? hashResult.stdout.trim() : null,
    };
  },
});
