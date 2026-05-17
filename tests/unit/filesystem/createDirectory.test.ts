import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createDirectory } from '../../../src/tools/filesystem/createDirectory.js';
import { createTmpProject, type TmpProject } from '../../helpers/createTmpProject.js';
import { invokeTool } from '../../helpers/invokeTool.js';

describe('createDirectory', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('creates a single directory', async () => {
    await invokeTool(createDirectory, { path: 'newdir' }, project.projectPath);
    const stats = await fs.stat(path.join(project.projectPath, 'newdir'));
    expect(stats.isDirectory()).toBe(true);
  });

  it('creates parents recursively', async () => {
    await invokeTool(createDirectory, { path: 'a/b/c' }, project.projectPath);
    const stats = await fs.stat(path.join(project.projectPath, 'a/b/c'));
    expect(stats.isDirectory()).toBe(true);
  });

  it('is idempotent on existing directory', async () => {
    await invokeTool(createDirectory, { path: 'dir' }, project.projectPath);
    await expect(
      invokeTool(createDirectory, { path: 'dir' }, project.projectPath),
    ).resolves.toEqual({ success: true, path: 'dir' });
  });

  it('rejects path traversal', async () => {
    await expect(
      invokeTool(createDirectory, { path: '../escape' }, project.projectPath),
    ).rejects.toThrow(/Access denied/);
  });
});
