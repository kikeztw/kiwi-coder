import { tool } from 'ai';
import { z } from 'zod';
import { getProjectPath } from '../shared/context.js';
import { runGit } from './runGit.js';

export const gitStash = tool({
  title: 'Git Stash',
  description:
    'Save (push), restore (pop) or list stashed changes. Use action="push" with an optional message to stash, "pop" to restore the latest stash, "list" to enumerate stashes.',
  inputSchema: z.object({
    action: z.enum(['push', 'pop', 'list']).describe('Stash operation'),
    message: z
      .string()
      .optional()
      .describe('Optional message when action=push'),
  }),
  needsApproval: true,
  execute: async ({ action, message }, options) => {
    const projectPath = getProjectPath(options);

    let args: string[];
    if (action === 'push') {
      args = ['stash', 'push'];
      if (message) args.push('-m', message);
    } else if (action === 'pop') {
      args = ['stash', 'pop'];
    } else {
      args = ['stash', 'list'];
    }

    const result = await runGit(args, projectPath);
    if (!result.success) {
      throw new Error(`git stash ${action} failed: ${result.stderr}`);
    }
    return {
      success: true,
      action,
      output: result.stdout.trim(),
    };
  },
});
