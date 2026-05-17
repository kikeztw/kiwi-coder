import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { resolveAndValidatePath } from '../shared/pathValidation.js';
import { getProjectPath } from '../shared/context.js';

export const writeFile = tool({
  title: 'Write File',
  description:
    'Create a new file with the given content. By default fails if the file already exists — set overwrite=true to overwrite. Parent directories are created automatically. To modify an existing file prefer the edit or multi_edit tools.',
  inputSchema: z.object({
    path: z.string().describe('Repository-relative or absolute path of the file to create'),
    content: z.string().describe('UTF-8 content to write'),
    overwrite: z
      .boolean()
      .optional()
      .default(false)
      .describe('Allow overwriting an existing file. Defaults to false for safety.'),
  }),
  execute: async ({ path: filePath, content, overwrite = false }, options) => {
    const projectPath = getProjectPath(options);
    const resolvedPath = resolveAndValidatePath(filePath, projectPath);

    if (!overwrite && existsSync(resolvedPath)) {
      throw new Error(
        `Refusing to overwrite existing file: ${filePath}. Pass overwrite=true to replace it, or use the edit tool.`,
      );
    }

    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(resolvedPath, content, 'utf-8');

    return { success: true, path: filePath, overwrote: existsSync(resolvedPath) && overwrite };
  },
});
