import { tool } from 'ai';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { resolveAndValidatePath } from '../shared/pathValidation.js';
import { getProjectPath } from '../shared/context.js';
import { isCommandSafe } from '../shared/allowlist.js';

const execAsync = promisify(exec);

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 5 * 60 * 1000;

export const runCommand = tool({
  title: 'Run Command',
  description:
    'Run a shell command in the project directory. The preferred package manager is pnpm (do NOT use npm). Read-only commands matching the safe allowlist (ls, cat, pnpm test, pnpm build, git status, ...) auto-run. Any other command requires user approval. Set cwd to run inside a subdirectory of the project.',
  inputSchema: z.object({
    command: z.string().describe('The shell command to execute'),
    description: z.string().optional().describe('Brief description of what this command does'),
    cwd: z
      .string()
      .optional()
      .describe('Working directory relative to or inside the project. Defaults to project root.'),
    timeoutMs: z
      .number()
      .int()
      .min(100)
      .max(MAX_TIMEOUT_MS)
      .optional()
      .describe('Timeout in milliseconds. Defaults to 30 000. Maximum 300 000.'),
  }),
  needsApproval: ({ command }) => !isCommandSafe(command),
  execute: async ({ command, cwd, timeoutMs }, options) => {
    const projectPath = getProjectPath(options);
    const workingDir = cwd
      ? resolveAndValidatePath(cwd, projectPath)
      : path.normalize(projectPath);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDir,
        timeout: timeoutMs ?? DEFAULT_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
      });
      return {
        stdout: stdout.toString().trim(),
        stderr: stderr.toString().trim(),
        exitCode: 0,
        success: true,
        autoApproved: isCommandSafe(command),
      };
    } catch (error) {
      const err = error as NodeJS.ErrnoException & { stdout?: Buffer | string; stderr?: Buffer | string; code?: number | string };
      return {
        stdout: (err.stdout?.toString() ?? '').trim(),
        stderr: (err.stderr?.toString() ?? err.message ?? 'Unknown error').trim(),
        exitCode: typeof err.code === 'number' ? err.code : 1,
        success: false,
        autoApproved: isCommandSafe(command),
      };
    }
  },
});
