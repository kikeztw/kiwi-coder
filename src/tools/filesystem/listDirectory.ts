import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { resolveAndValidatePath } from '../shared/pathValidation.js';
import { isBlockedFileName } from '../shared/pathValidation.js';
import { getProjectPath } from '../shared/context.js';

export const listDirectory = tool({
  title: 'List Directory',
  description:
    'List the immediate contents of a directory. Each entry includes name, type (file or directory) and relative path. Optionally include file sizes and a summary.',
  inputSchema: z.object({
    path: z.string().describe('Repository-relative or absolute directory path'),
    withSizes: z
      .boolean()
      .optional()
      .default(false)
      .describe('Include file sizes in bytes and a summary block'),
    sortBy: z
      .enum(['name', 'size'])
      .optional()
      .default('name')
      .describe('Sort entries by name (default) or size (descending)'),
  }),
  execute: async ({ path: dirPath, withSizes = false, sortBy = 'name' }, options) => {
    const projectPath = getProjectPath(options);
    const resolvedPath = resolveAndValidatePath(dirPath, projectPath);

    const rawEntries = await fs.readdir(resolvedPath, { withFileTypes: true });
    const entries = rawEntries.filter((entry) => !isBlockedFileName(entry.name));

    const decorated = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        const isDir = entry.isDirectory();
        let size = 0;
        if (withSizes && entry.isFile()) {
          const stats = await fs.stat(path.join(resolvedPath, entry.name));
          size = stats.size;
        }
        return {
          name: entry.name,
          type: isDir ? ('directory' as const) : ('file' as const),
          path: fullPath,
          ...(withSizes ? { size } : {}),
        };
      }),
    );

    if (sortBy === 'size' && withSizes) {
      decorated.sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
    } else {
      decorated.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (!withSizes) {
      return { entries: decorated };
    }

    const totalFiles = decorated.filter((e) => e.type === 'file').length;
    const totalDirectories = decorated.filter((e) => e.type === 'directory').length;
    const totalSize = decorated.reduce((sum, e) => sum + (e.size ?? 0), 0);

    return {
      entries: decorated,
      summary: { totalFiles, totalDirectories, totalSize },
    };
  },
});
