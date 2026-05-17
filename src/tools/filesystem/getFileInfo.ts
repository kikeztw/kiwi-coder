import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import { resolveAndValidatePath } from '../shared/pathValidation.js';
import { getProjectPath } from '../shared/context.js';

export const getFileInfo = tool({
  title: 'Get File Info',
  description:
    'Get metadata for a file or directory: size, type, octal permissions and timestamps (created, modified, accessed).',
  inputSchema: z.object({
    path: z.string().describe('Repository-relative or absolute path'),
  }),
  execute: async ({ path: filePath }, options) => {
    const projectPath = getProjectPath(options);
    const resolvedPath = resolveAndValidatePath(filePath, projectPath);
    const stats = await fs.stat(resolvedPath);
    return {
      size: stats.size,
      type: stats.isDirectory() ? 'directory' : 'file',
      permissions: stats.mode.toString(8).slice(-3),
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
    };
  },
});
