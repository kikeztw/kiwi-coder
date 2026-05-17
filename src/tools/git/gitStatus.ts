import { tool } from 'ai';
import { z } from 'zod';
import { getProjectPath } from '../shared/context.js';
import { runGit } from './runGit.js';

export type GitStatusEntry = {
  path: string;
  indexStatus: string;
  workTreeStatus: string;
};

export const gitStatus = tool({
  title: 'Git Status',
  description:
    'Show the working tree status. Returns the current branch and arrays of staged, unstaged and untracked files.',
  inputSchema: z.object({}),
  execute: async (_input, options) => {
    const projectPath = getProjectPath(options);

    const branchResult = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], projectPath);
    if (!branchResult.success) {
      throw new Error(`git status failed: ${branchResult.stderr || 'not a git repository'}`);
    }

    const statusResult = await runGit(['status', '--porcelain=v1'], projectPath);
    if (!statusResult.success) {
      throw new Error(`git status failed: ${statusResult.stderr}`);
    }

    const staged: GitStatusEntry[] = [];
    const unstaged: GitStatusEntry[] = [];
    const untracked: string[] = [];

    for (const line of statusResult.stdout.split('\n')) {
      if (!line) continue;
      const indexStatus = line[0];
      const workTreeStatus = line[1];
      const filePath = line.slice(3);

      if (indexStatus === '?' && workTreeStatus === '?') {
        untracked.push(filePath);
        continue;
      }
      if (indexStatus !== ' ' && indexStatus !== '?') {
        staged.push({ path: filePath, indexStatus, workTreeStatus });
      }
      if (workTreeStatus !== ' ' && workTreeStatus !== '?') {
        unstaged.push({ path: filePath, indexStatus, workTreeStatus });
      }
    }

    return {
      branch: branchResult.stdout.trim(),
      staged,
      unstaged,
      untracked,
      clean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0,
    };
  },
});
