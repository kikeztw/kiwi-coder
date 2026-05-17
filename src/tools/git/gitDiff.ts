import { tool } from 'ai';
import { z } from 'zod';
import { getProjectPath } from '../shared/context.js';
import { runGit } from './runGit.js';

export const gitDiff = tool({
  title: 'Git Diff',
  description:
    'Show changes between commits, the working tree and the index. Without options shows unstaged changes. Use staged=true for the index, fromRef/toRef for ranges, path to limit to a file.',
  inputSchema: z.object({
    staged: z.boolean().optional().describe('Show staged changes (git diff --cached)'),
    path: z.string().optional().describe('Limit diff to this file or directory'),
    fromRef: z.string().optional().describe('Compare from this ref'),
    toRef: z.string().optional().describe('Compare to this ref (defaults to HEAD if fromRef set)'),
  }),
  execute: async ({ staged, path: filePath, fromRef, toRef }, options) => {
    const projectPath = getProjectPath(options);

    const args = ['diff'];
    if (staged) args.push('--cached');
    if (fromRef) {
      args.push(toRef ? `${fromRef}..${toRef}` : fromRef);
    }
    if (filePath) {
      args.push('--', filePath);
    }

    const result = await runGit(args, projectPath);
    if (!result.success) {
      throw new Error(`git diff failed: ${result.stderr}`);
    }
    return {
      diff: result.stdout,
      isEmpty: result.stdout.trim().length === 0,
    };
  },
});
