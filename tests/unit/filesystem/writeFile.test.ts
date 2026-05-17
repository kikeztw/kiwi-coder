import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { writeFile } from '../../../src/tools/filesystem/writeFile.js';
import { createTmpProject, writeFixture, type TmpProject } from '../../helpers/createTmpProject.js';
import { invokeTool } from '../../helpers/invokeTool.js';

describe('writeFile', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('creates a new file', async () => {
    await invokeTool(writeFile, { path: 'new.txt', content: 'data' }, project.projectPath);
    const onDisk = await fs.readFile(path.join(project.projectPath, 'new.txt'), 'utf-8');
    expect(onDisk).toBe('data');
  });

  it('creates parent directories automatically', async () => {
    await invokeTool(
      writeFile,
      { path: 'deep/nested/file.txt', content: 'nested' },
      project.projectPath,
    );
    const onDisk = await fs.readFile(
      path.join(project.projectPath, 'deep/nested/file.txt'),
      'utf-8',
    );
    expect(onDisk).toBe('nested');
  });

  it('refuses to overwrite by default', async () => {
    await writeFixture(project.projectPath, 'existing.txt', 'original');
    await expect(
      invokeTool(writeFile, { path: 'existing.txt', content: 'new' }, project.projectPath),
    ).rejects.toThrow(/Refusing to overwrite/);

    const onDisk = await fs.readFile(path.join(project.projectPath, 'existing.txt'), 'utf-8');
    expect(onDisk).toBe('original');
  });

  it('overwrites when overwrite=true', async () => {
    await writeFixture(project.projectPath, 'existing.txt', 'original');
    await invokeTool(
      writeFile,
      { path: 'existing.txt', content: 'new', overwrite: true },
      project.projectPath,
    );
    const onDisk = await fs.readFile(path.join(project.projectPath, 'existing.txt'), 'utf-8');
    expect(onDisk).toBe('new');
  });

  it('rejects path traversal', async () => {
    await expect(
      invokeTool(writeFile, { path: '../escape.txt', content: 'x' }, project.projectPath),
    ).rejects.toThrow(/Access denied/);
  });
});
