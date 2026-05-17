import { tool } from 'ai';
import { z } from 'zod';
import { getProjectPath } from '../shared/context.js';
import { runGit } from './runGit.js';

export const gitLog = tool({
  title: 'Git Log',
  description:
    'Show the commit history. Default limit is 20 entries. Optionally restrict to a path or change the format.',
  inputSchema: z.object({
    limit: z.number().int().min(1).max(200).optional().default(20),
    path: z.string().optional().describe('Restrict log to commits affecting this file or directory'),
    format: z
      .enum(['oneline', 'short', 'full'])
      .optional()
      .default('oneline')
      .describe('Output format'),
  }),
  execute: async ({ limit = 20, path: filePath, format = 'oneline' }, options) => {
    const projectPath = getProjectPath(options);

    const formatFlag = format === 'oneline' ? '--oneline' : `--format=${format}`;
    const args = ['log', `-${limit}`, formatFlag];
    if (filePath) args.push('--', filePath);

    const result = await runGit(args, projectPath);
    if (!result.success) {
      throw new Error(`git log failed: ${result.stderr}`);
    }
    return {
      log: result.stdout,
      limit,
    };
  },
});
