import { tool } from 'ai';
import { z } from 'zod';
import { getProjectPath } from '../shared/context.js';
import { runGit } from './runGit.js';

export const gitBlame = tool({
  title: 'Git Blame',
  description:
    'Show what revision and author last modified each line of a file. Use line to focus on a single line (1-indexed).',
  inputSchema: z.object({
    path: z.string().describe('Path to the file to blame'),
    line: z.number().int().min(1).optional().describe('Limit to this single line (1-indexed)'),
  }),
  execute: async ({ path: filePath, line }, options) => {
    const projectPath = getProjectPath(options);

    const args = ['blame'];
    if (line) args.push('-L', `${line},${line}`);
    args.push('--', filePath);

    const result = await runGit(args, projectPath);
    if (!result.success) {
      throw new Error(`git blame failed: ${result.stderr}`);
    }
    return { blame: result.stdout };
  },
});
