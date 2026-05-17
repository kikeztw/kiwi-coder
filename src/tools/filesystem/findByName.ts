import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { resolveAndValidatePath, isBlockedFileName } from '../shared/pathValidation.js';
import { getProjectPath } from '../shared/context.js';

const MAX_RESULTS = 50;

function globToRegExp(pattern: string): RegExp {
  // Escape regex specials except glob metacharacters * ? [ ]
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*') {
      // Handle ** as match-anything-including-slashes
      if (pattern[i + 1] === '*') {
        re += '.*';
        i++;
      } else {
        re += '[^/]*';
      }
    } else if (ch === '?') {
      re += '[^/]';
    } else if ('.+^$(){}|\\'.includes(ch)) {
      re += '\\' + ch;
    } else {
      re += ch;
    }
  }
  return new RegExp('^' + re + '$');
}

export const findByName = tool({
  title: 'Find By Name',
  description:
    'Search for files and directories by name within a directory using glob-like patterns (supports * ? **). Optionally filter by type, by file extensions, or by max depth. Capped at 50 matches.',
  inputSchema: z.object({
    searchDirectory: z
      .string()
      .describe('Directory to search within. Searches recursively unless maxDepth is set.'),
    pattern: z
      .string()
      .optional()
      .describe('Glob pattern matched against the file/directory name (e.g. "*.ts", "test-*")'),
    extensions: z
      .array(z.string())
      .optional()
      .describe('File extensions without leading dot. Matches if any extension matches.'),
    excludes: z
      .array(z.string())
      .optional()
      .describe('Substring patterns to exclude'),
    type: z
      .enum(['file', 'directory', 'any'])
      .optional()
      .default('any')
      .describe('Filter results by entry type'),
    maxDepth: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Maximum directory depth to recurse into'),
  }),
  execute: async (
    { searchDirectory, pattern, extensions, excludes = [], type = 'any', maxDepth },
    options,
  ) => {
    const projectPath = getProjectPath(options);
    const root = resolveAndValidatePath(searchDirectory, projectPath);

    const nameRegex = pattern ? globToRegExp(pattern) : null;
    const lowerExts = extensions?.map((ext) => ext.toLowerCase().replace(/^\./, ''));

    const matches: Array<{ name: string; type: 'file' | 'directory'; path: string }> = [];

    async function walk(currentPath: string, depth: number) {
      if (matches.length >= MAX_RESULTS) return;
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (matches.length >= MAX_RESULTS) return;
        if (isBlockedFileName(entry.name)) continue;
        if (excludes.some((ex) => entry.name.includes(ex))) continue;

        const fullPath = path.join(currentPath, entry.name);
        const isDir = entry.isDirectory();
        const entryType: 'file' | 'directory' = isDir ? 'directory' : 'file';

        const typeMatches = type === 'any' || type === entryType;
        const nameMatches = !nameRegex || nameRegex.test(entry.name);

        let extMatches = true;
        if (lowerExts && entry.isFile()) {
          const ext = path.extname(entry.name).slice(1).toLowerCase();
          extMatches = lowerExts.includes(ext);
        } else if (lowerExts && !entry.isFile()) {
          extMatches = false;
        }

        if (typeMatches && nameMatches && extMatches) {
          matches.push({
            name: entry.name,
            type: entryType,
            path: path.relative(projectPath, fullPath) || entry.name,
          });
        }

        if (isDir && (maxDepth === undefined || depth + 1 < maxDepth)) {
          await walk(fullPath, depth + 1);
        }
      }
    }

    await walk(root, 0);

    return {
      matches,
      count: matches.length,
      truncated: matches.length >= MAX_RESULTS,
    };
  },
});
