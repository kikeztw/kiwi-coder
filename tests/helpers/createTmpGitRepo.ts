import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createTmpProject, type TmpProject } from './createTmpProject.js';

const execFileAsync = promisify(execFile);

async function git(cwd: string, args: string[]) {
  await execFileAsync('git', args, { cwd });
}

export async function createTmpGitRepo(): Promise<TmpProject> {
  const project = await createTmpProject();
  const cwd = project.projectPath;

  await git(cwd, ['init', '-b', 'main']);
  await git(cwd, ['config', 'user.email', 'kiwi-test@example.com']);
  await git(cwd, ['config', 'user.name', 'Kiwi Test']);
  await git(cwd, ['config', 'commit.gpgsign', 'false']);

  await fs.writeFile(path.join(cwd, 'README.md'), '# initial\n', 'utf-8');
  await git(cwd, ['add', 'README.md']);
  await git(cwd, ['commit', '-m', 'initial commit']);

  return project;
}

export async function gitInRepo(repoPath: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync('git', args, { cwd: repoPath });
  return { stdout: stdout.toString(), stderr: stderr.toString() };
}
