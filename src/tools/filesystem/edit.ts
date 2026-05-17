import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import { resolveAndValidatePath } from '../shared/pathValidation.js';
import { getProjectPath } from '../shared/context.js';

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count++;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

export const edit = tool({
  title: 'Edit File',
  description:
    'Perform an exact string replacement in a file. By default oldString must appear exactly once in the file (the tool fails if not unique). Set replaceAll=true to replace every occurrence. Whitespace must match exactly.',
  inputSchema: z.object({
    path: z.string().describe('Repository-relative or absolute path of the file to edit'),
    oldString: z.string().min(1).describe('Exact text to find. Whitespace must match.'),
    newString: z.string().describe('Text to replace oldString with. May be empty to delete.'),
    replaceAll: z
      .boolean()
      .optional()
      .default(false)
      .describe('Replace every occurrence. Default is false (require unique match).'),
  }),
  execute: async ({ path: filePath, oldString, newString, replaceAll = false }, options) => {
    if (oldString === newString) {
      throw new Error('oldString and newString are identical — nothing to do.');
    }

    const projectPath = getProjectPath(options);
    const resolvedPath = resolveAndValidatePath(filePath, projectPath);
    const original = await fs.readFile(resolvedPath, 'utf-8');

    const matches = countOccurrences(original, oldString);
    if (matches === 0) {
      throw new Error(`oldString not found in ${filePath}.`);
    }
    if (matches > 1 && !replaceAll) {
      throw new Error(
        `oldString matches ${matches} occurrences in ${filePath}. Provide a more unique string or set replaceAll=true.`,
      );
    }

    const updated = replaceAll
      ? original.split(oldString).join(newString)
      : original.replace(oldString, newString);

    await fs.writeFile(resolvedPath, updated, 'utf-8');

    return {
      success: true,
      path: filePath,
      replacements: replaceAll ? matches : 1,
    };
  },
});
