import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import { resolveAndValidatePath } from '../shared/pathValidation.js';
import { getProjectPath } from '../shared/context.js';

export const readFile = tool({
  title: 'Read File',
  description:
    'Read the contents of a text file. Treats the file as UTF-8 regardless of extension. Optionally read a slice of lines using offset (1-indexed) and limit. Returns the raw text content.',
  inputSchema: z.object({
    path: z.string().describe('Repository-relative or absolute path to the file'),
    offset: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('1-indexed line number to start reading from'),
    limit: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Number of lines to read starting at offset (or from the beginning)'),
  }),
  execute: async ({ path: filePath, offset, limit }, options) => {
    const projectPath = getProjectPath(options);
    const resolvedPath = resolveAndValidatePath(filePath, projectPath);
    const content = await fs.readFile(resolvedPath, 'utf-8');

    if (offset === undefined && limit === undefined) {
      return content;
    }

    const lines = content.split('\n');
    const start = offset ? offset - 1 : 0;
    const end = limit ? start + limit : lines.length;
    return lines.slice(start, end).join('\n');
  },
});
