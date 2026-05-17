import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type GitResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
};

/**
 * Run a git command in the given directory using execFile (no shell interpolation).
 * Returns structured stdout/stderr/exitCode without throwing on non-zero exit codes.
 */
export async function runGit(args: string[], cwd: string, timeoutMs = 30_000): Promise<GitResult> {
  try {
    const { stdout, stderr } = await execFileAsync('git', args, {
      cwd,
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
    });
    return {
      stdout: stdout.toString(),
      stderr: stderr.toString(),
      exitCode: 0,
      success: true,
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      code?: number | string;
    };
    return {
      stdout: err.stdout?.toString() ?? '',
      stderr: (err.stderr?.toString() ?? err.message ?? '').trim(),
      exitCode: typeof err.code === 'number' ? err.code : 1,
      success: false,
    };
  }
}
