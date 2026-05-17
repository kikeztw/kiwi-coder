import { tool } from 'ai';
import { z } from 'zod';
import { getProjectPath } from '../shared/context.js';
import { runGit } from './runGit.js';

export const gitBranch = tool({
  title: 'Git Branch',
  description:
    'List branches or report the current branch. Use action="list" for all local branches, action="current" for just the current branch name.',
  inputSchema: z.object({
    action: z.enum(['list', 'current']).default('list'),
    includeRemote: z
      .boolean()
      .optional()
      .default(false)
      .describe('Include remote-tracking branches when action=list'),
  }),
  execute: async ({ action = 'list', includeRemote = false }, options) => {
    const projectPath = getProjectPath(options);

    if (action === 'current') {
      const result = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], projectPath);
      if (!result.success) {
        throw new Error(`git branch failed: ${result.stderr}`);
      }
      return { current: result.stdout.trim() };
    }

    const args = ['branch'];
    if (includeRemote) args.push('-a');

    const result = await runGit(args, projectPath);
    if (!result.success) {
      throw new Error(`git branch failed: ${result.stderr}`);
    }

    const branches = result.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const currentLine = branches.find((line) => line.startsWith('*'));
    const current = currentLine ? currentLine.replace(/^\*\s+/, '').trim() : null;
    const all = branches.map((line) => line.replace(/^\*\s+/, '').trim());

    return { current, branches: all };
  },
});
