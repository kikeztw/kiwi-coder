import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { resolveAndValidatePath } from '../shared/pathValidation.js';
import { getProjectPath } from '../shared/context.js';

export const moveFile = tool({
  title: 'Move File',
  description:
    'Move or rename a file or directory. Fails if the destination already exists to prevent accidental overwrites.',
  inputSchema: z.object({
    source: z.string().describe('Source path'),
    destination: z.string().describe('Destination path'),
  }),
  execute: async ({ source, destination }, options) => {
    const projectPath = getProjectPath(options);
    const resolvedSource = resolveAndValidatePath(source, projectPath);
    const resolvedDestination = resolveAndValidatePath(destination, projectPath);

    if (!existsSync(resolvedSource)) {
      throw new Error(`Source does not exist: ${source}`);
    }
    if (existsSync(resolvedDestination)) {
      throw new Error(`Destination already exists: ${destination}`);
    }

    await fs.rename(resolvedSource, resolvedDestination);
    return { success: true, from: source, to: destination };
  },
});
