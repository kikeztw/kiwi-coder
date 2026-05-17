import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { edit } from '../../../src/tools/filesystem/edit.js';
import { createTmpProject, writeFixture, type TmpProject } from '../../helpers/createTmpProject.js';
import { invokeTool } from '../../helpers/invokeTool.js';

describe('edit', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('replaces a unique occurrence', async () => {
    await writeFixture(project.projectPath, 'file.ts', 'const foo = 1;\nconst bar = 2;');
    await invokeTool(
      edit,
      { path: 'file.ts', oldString: 'const foo = 1;', newString: 'const foo = 99;' },
      project.projectPath,
    );
    const onDisk = await fs.readFile(path.join(project.projectPath, 'file.ts'), 'utf-8');
    expect(onDisk).toBe('const foo = 99;\nconst bar = 2;');
  });

  it('fails when oldString is not found', async () => {
    await writeFixture(project.projectPath, 'file.ts', 'const foo = 1;');
    await expect(
      invokeTool(
        edit,
        { path: 'file.ts', oldString: 'missing', newString: 'x' },
        project.projectPath,
      ),
    ).rejects.toThrow(/not found/);
  });

  it('fails when oldString matches multiple times without replaceAll', async () => {
    await writeFixture(project.projectPath, 'file.ts', 'foo\nfoo\nfoo');
    await expect(
      invokeTool(
        edit,
        { path: 'file.ts', oldString: 'foo', newString: 'bar' },
        project.projectPath,
      ),
    ).rejects.toThrow(/3 occurrences/);
  });

  it('replaces all occurrences when replaceAll=true', async () => {
    await writeFixture(project.projectPath, 'file.ts', 'foo\nfoo\nfoo');
    const result = await invokeTool(
      edit,
      { path: 'file.ts', oldString: 'foo', newString: 'bar', replaceAll: true },
      project.projectPath,
    );
    expect(result.replacements).toBe(3);
    const onDisk = await fs.readFile(path.join(project.projectPath, 'file.ts'), 'utf-8');
    expect(onDisk).toBe('bar\nbar\nbar');
  });

  it('refuses no-op edits', async () => {
    await writeFixture(project.projectPath, 'file.ts', 'foo');
    await expect(
      invokeTool(edit, { path: 'file.ts', oldString: 'foo', newString: 'foo' }, project.projectPath),
    ).rejects.toThrow(/identical/);
  });
});
