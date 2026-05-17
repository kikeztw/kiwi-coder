import { tool } from 'ai';
import { z } from 'zod';
import { getProjectPath } from '../shared/context.js';
import { runGit } from './runGit.js';

export const gitAdd = tool({
  title: 'Git Add',
  description: 'Stage one or more paths for the next commit.',
  inputSchema: z.object({
    paths: z
      .array(z.string())
      .min(1)
      .describe('Paths to stage. Use "." to stage all changes.'),
  }),
  needsApproval: true,
  execute: async ({ paths }, options) => {
    const projectPath = getProjectPath(options);

    const result = await runGit(['add', '--', ...paths], projectPath);
    if (!result.success) {
      throw new Error(`git add failed: ${result.stderr}`);
    }
    return { success: true, staged: paths };
  },
});
