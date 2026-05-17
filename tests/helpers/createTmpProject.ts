import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';

export type TmpProject = {
  projectPath: string;
  cleanup: () => Promise<void>;
  /** Convenience: wraps tool execute() options with the right context. */
  ctx: { experimental_context: { projectPath: string } };
};

export async function createTmpProject(): Promise<TmpProject> {
  // os.tmpdir() may resolve symlinks differently on macOS (/var vs /private/var).
  // We resolve real path so that tools using path.normalize/startsWith comparisons work.
  const tmpRoot = await fs.realpath(os.tmpdir());
  const projectPath = path.join(tmpRoot, `kiwi-test-${randomUUID()}`);
  await fs.mkdir(projectPath, { recursive: true });

  return {
    projectPath,
    ctx: { experimental_context: { projectPath } },
    cleanup: async () => {
      await fs.rm(projectPath, { recursive: true, force: true });
    },
  };
}

export async function writeFixture(
  projectPath: string,
  relativePath: string,
  content: string,
): Promise<string> {
  const full = path.join(projectPath, relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, 'utf-8');
  return full;
}
