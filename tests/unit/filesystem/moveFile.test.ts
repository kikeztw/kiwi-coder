import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { moveFile } from '../../../src/tools/filesystem/moveFile.js';
import { createTmpProject, writeFixture, type TmpProject } from '../../helpers/createTmpProject.js';
import { invokeTool } from '../../helpers/invokeTool.js';

describe('moveFile', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('moves a file to a new location', async () => {
    await writeFixture(project.projectPath, 'a.txt', 'data');
    await invokeTool(
      moveFile,
      { source: 'a.txt', destination: 'b.txt' },
      project.projectPath,
    );
    const moved = await fs.readFile(path.join(project.projectPath, 'b.txt'), 'utf-8');
    expect(moved).toBe('data');
    await expect(fs.access(path.join(project.projectPath, 'a.txt'))).rejects.toThrow();
  });

  it('refuses to overwrite existing destination', async () => {
    await writeFixture(project.projectPath, 'a.txt', 'A');
    await writeFixture(project.projectPath, 'b.txt', 'B');
    await expect(
      invokeTool(moveFile, { source: 'a.txt', destination: 'b.txt' }, project.projectPath),
    ).rejects.toThrow(/Destination already exists/);
  });

  it('fails when source does not exist', async () => {
    await expect(
      invokeTool(
        moveFile,
        { source: 'missing.txt', destination: 'dst.txt' },
        project.projectPath,
      ),
    ).rejects.toThrow(/Source does not exist/);
  });

  it('rejects path traversal in source or destination', async () => {
    await writeFixture(project.projectPath, 'a.txt', 'data');
    await expect(
      invokeTool(
        moveFile,
        { source: 'a.txt', destination: '../escape.txt' },
        project.projectPath,
      ),
    ).rejects.toThrow(/Access denied/);
  });
});
