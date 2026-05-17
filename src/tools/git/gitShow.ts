import { tool } from 'ai';
import { z } from 'zod';
import { getProjectPath } from '../shared/context.js';
import { runGit } from './runGit.js';

export const gitShow = tool({
  title: 'Git Show',
  description:
    'Show information about a git object. Without path: shows the commit details and diff for ref. With path: shows the file content at ref.',
  inputSchema: z.object({
    ref: z.string().describe('Commit hash, tag, branch, or HEAD~N'),
    path: z
      .string()
      .optional()
      .describe('Optional file path. If provided, shows file contents at that ref instead of commit details.'),
  }),
  execute: async ({ ref, path: filePath }, options) => {
    const projectPath = getProjectPath(options);

    const args = ['show'];
    if (filePath) {
      args.push(`${ref}:${filePath}`);
    } else {
      args.push(ref);
    }

    const result = await runGit(args, projectPath);
    if (!result.success) {
      throw new Error(`git show failed: ${result.stderr}`);
    }
    return { output: result.stdout };
  },
});
