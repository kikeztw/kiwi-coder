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

const editEntrySchema = z.object({
  oldString: z.string().min(1),
  newString: z.string(),
  replaceAll: z.boolean().optional().default(false),
});

export const multiEdit = tool({
  title: 'Multi Edit',
  description:
    'Perform multiple exact string replacements in a single file atomically. Each edit is applied in order on the result of the previous edit. If any edit fails (oldString not found, ambiguous match without replaceAll, or oldString===newString), no changes are written.',
  inputSchema: z.object({
    path: z.string().describe('Repository-relative or absolute path of the file to edit'),
    edits: z
      .array(editEntrySchema)
      .min(1)
      .describe('Sequential list of edits to apply atomically'),
  }),
  execute: async ({ path: filePath, edits }, options) => {
    const projectPath = getProjectPath(options);
    const resolvedPath = resolveAndValidatePath(filePath, projectPath);
    const original = await fs.readFile(resolvedPath, 'utf-8');

    let working = original;
    const applied: Array<{ index: number; replacements: number }> = [];

    for (let i = 0; i < edits.length; i++) {
      const { oldString, newString, replaceAll = false } = edits[i];
      if (oldString === newString) {
        throw new Error(`Edit #${i}: oldString and newString are identical.`);
      }

      const matches = countOccurrences(working, oldString);
      if (matches === 0) {
        throw new Error(`Edit #${i}: oldString not found in current file state.`);
      }
      if (matches > 1 && !replaceAll) {
        throw new Error(
          `Edit #${i}: oldString matches ${matches} occurrences. Provide a more unique string or set replaceAll=true.`,
        );
      }

      working = replaceAll
        ? working.split(oldString).join(newString)
        : working.replace(oldString, newString);

      applied.push({ index: i, replacements: replaceAll ? matches : 1 });
    }

    await fs.writeFile(resolvedPath, working, 'utf-8');

    return { success: true, path: filePath, applied };
  },
});
