import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import { resolveAndValidatePath } from '../shared/pathValidation.js';
import { getProjectPath } from '../shared/context.js';

export const createDirectory = tool({
  title: 'Create Directory',
  description:
    'Create a directory, including parent directories if needed. Idempotent — succeeds if the directory already exists.',
  inputSchema: z.object({
    path: z.string().describe('Repository-relative or absolute directory path to create'),
  }),
  execute: async ({ path: dirPath }, options) => {
    const projectPath = getProjectPath(options);
    const resolvedPath = resolveAndValidatePath(dirPath, projectPath);
    await fs.mkdir(resolvedPath, { recursive: true });
    return { success: true, path: dirPath };
  },
});
