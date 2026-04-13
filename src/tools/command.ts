import { tool } from 'ai';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const runCommand = tool({
  title: 'Run Commands',
  description: 'Run a shell command in the project directory. Use this to execute build commands, run tests, list files, check git status, etc.',
  inputSchema: z.object({
    command: z.string().describe('The shell command to execute'),
    description: z.string().optional().describe('Brief description of what this command does'),
  }),
  needsApproval: true,
  execute: async ({ command }, options) => {
    const { projectPath } = (options as { experimental_context: { projectPath: string } }).experimental_context;
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: projectPath,
        timeout: 30000,
      });
      return {
        stdout: stdout.trim() || '',
        stderr: stderr.trim() || '',
        exitCode: 0,
        success: true,
      };
    } catch (error: any) {
      return {
        stdout: (error.stdout || '').trim(),
        stderr: (error.stderr || error.message || 'Unknown error').trim(),
        exitCode: error.code || 1,
        success: false,
      };
    }
  },
});

export const commandTools = { run_command: runCommand };
