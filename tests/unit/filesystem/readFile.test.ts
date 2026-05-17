import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile } from '../../../src/tools/filesystem/readFile.js';
import { createTmpProject, writeFixture, type TmpProject } from '../../helpers/createTmpProject.js';
import { invokeTool } from '../../helpers/invokeTool.js';

describe('readFile', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('reads a file end-to-end', async () => {
    await writeFixture(project.projectPath, 'hello.txt', 'hello world');
    const result = await invokeTool(readFile, { path: 'hello.txt' }, project.projectPath);
    expect(result).toBe('hello world');
  });

  it('supports offset+limit slicing', async () => {
    await writeFixture(project.projectPath, 'lines.txt', 'a\nb\nc\nd\ne');
    const result = await invokeTool(
      readFile,
      { path: 'lines.txt', offset: 2, limit: 2 },
      project.projectPath,
    );
    expect(result).toBe('b\nc');
  });

  it('rejects path traversal', async () => {
    await expect(
      invokeTool(readFile, { path: '../../etc/passwd' }, project.projectPath),
    ).rejects.toThrow(/Access denied/);
  });

  it('rejects blocked files (.env)', async () => {
    await writeFixture(project.projectPath, '.env', 'SECRET=1');
    await expect(invokeTool(readFile, { path: '.env' }, project.projectPath)).rejects.toThrow(
      /protected/,
    );
  });

  it('throws if file does not exist', async () => {
    await expect(invokeTool(readFile, { path: 'missing.txt' }, project.projectPath)).rejects.toThrow();
  });
});
