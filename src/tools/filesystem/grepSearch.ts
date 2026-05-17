import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { resolveAndValidatePath, isBlockedFileName } from '../shared/pathValidation.js';
import { getProjectPath } from '../shared/context.js';

const MAX_MATCHES = 100;

export type GrepMatch = {
  path: string;
  line: number;
  text: string;
};

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function globToRegExp(pattern: string): RegExp {
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*') {
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

async function rgAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('rg', ['--version'], { stdio: 'ignore' });
    child.on('error', () => resolve(false));
    child.on('exit', (code) => resolve(code === 0));
  });
}

async function runRipgrep(
  query: string,
  cwd: string,
  fixedStrings: boolean,
  caseSensitive: boolean,
  includes?: string[],
): Promise<GrepMatch[]> {
  return new Promise((resolve, reject) => {
    const args = ['--json', '--max-count', String(MAX_MATCHES)];
    if (fixedStrings) args.push('--fixed-strings');
    args.push(caseSensitive ? '--case-sensitive' : '--smart-case');
    if (includes) {
      for (const inc of includes) {
        args.push('--glob', inc);
      }
    }
    args.push('--', query, '.');

    const child = spawn('rg', args, { cwd });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      // rg returns 1 when no matches are found — not an error
      if (code !== null && code > 1) {
        return reject(new Error(`ripgrep exited ${code}: ${stderr.trim()}`));
      }
      const matches: GrepMatch[] = [];
      for (const line of stdout.split('\n')) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === 'match') {
            matches.push({
              path: event.data.path?.text ?? '',
              line: event.data.line_number ?? 0,
              text: (event.data.lines?.text ?? '').replace(/\n$/, ''),
            });
            if (matches.length >= MAX_MATCHES) break;
          }
        } catch {
          // ignore non-JSON lines
        }
      }
      resolve(matches);
    });
  });
}

async function fallbackSearch(
  query: string,
  root: string,
  fixedStrings: boolean,
  caseSensitive: boolean,
  includes: string[] | undefined,
  projectPath: string,
): Promise<GrepMatch[]> {
  const flags = caseSensitive ? '' : 'i';
  const pattern = fixedStrings ? escapeRegex(query) : query;
  const regex = new RegExp(pattern, flags);
  const includeRegexes = includes?.map(globToRegExp);
  const matches: GrepMatch[] = [];

  async function walk(current: string) {
    if (matches.length >= MAX_MATCHES) return;
    let entries: import('fs').Dirent[];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (matches.length >= MAX_MATCHES) return;
      if (isBlockedFileName(entry.name)) continue;
      if (entry.name === 'node_modules' || entry.name === '.git') continue;

      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;

      if (includeRegexes && !includeRegexes.some((re) => re.test(entry.name))) continue;

      let content: string;
      try {
        content = await fs.readFile(full, 'utf-8');
      } catch {
        continue; // skip binary / unreadable
      }

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (matches.length >= MAX_MATCHES) return;
        if (regex.test(lines[i])) {
          matches.push({
            path: path.relative(projectPath, full) || entry.name,
            line: i + 1,
            text: lines[i],
          });
        }
      }
    }
  }

  await walk(root);
  return matches;
}

export const grepSearch = tool({
  title: 'Grep Search',
  description:
    'Search for a regex (or fixed string) inside files under a directory. Uses ripgrep when available, otherwise falls back to a node-based search. Capped at 100 matches. Use includes to filter files by glob patterns (e.g. "*.ts").',
  inputSchema: z.object({
    query: z.string().min(1).describe('The pattern to search for'),
    searchPath: z
      .string()
      .optional()
      .default('.')
      .describe('Directory or file to search within (default: project root)'),
    includes: z
      .array(z.string())
      .optional()
      .describe('Glob patterns to filter file names (e.g. ["*.ts", "*.tsx"])'),
    fixedStrings: z
      .boolean()
      .optional()
      .default(false)
      .describe('If true, treat query as a literal string (no regex). Default false.'),
    caseSensitive: z
      .boolean()
      .optional()
      .default(false)
      .describe('If true, force case-sensitive search. Default false (smart-case).'),
  }),
  execute: async (
    { query, searchPath = '.', includes, fixedStrings = false, caseSensitive = false },
    options,
  ) => {
    const projectPath = getProjectPath(options);
    const root = resolveAndValidatePath(searchPath, projectPath);

    const useRg = await rgAvailable();
    const matches = useRg
      ? await runRipgrep(query, root, fixedStrings, caseSensitive, includes).then((rs) =>
          rs.map((r) => ({
            path: path.isAbsolute(r.path)
              ? path.relative(projectPath, r.path) || r.path
              : path.relative(projectPath, path.join(root, r.path)) || r.path,
            line: r.line,
            text: r.text,
          })),
        )
      : await fallbackSearch(query, root, fixedStrings, caseSensitive, includes, projectPath);

    return {
      engine: useRg ? 'ripgrep' : 'fallback',
      matches: matches.slice(0, MAX_MATCHES),
      count: matches.length,
      truncated: matches.length >= MAX_MATCHES,
    };
  },
});
