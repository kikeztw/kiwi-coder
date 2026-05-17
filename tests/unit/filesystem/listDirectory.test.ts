import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { listDirectory } from '../../../src/tools/filesystem/listDirectory.js';
import { createTmpProject, writeFixture, type TmpProject } from '../../helpers/createTmpProject.js';
import { invokeTool } from '../../helpers/invokeTool.js';

describe('listDirectory', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
    await writeFixture(project.projectPath, 'a.txt', 'aa');
    await writeFixture(project.projectPath, 'b.txt', 'bbbb');
    await writeFixture(project.projectPath, 'sub/c.txt', 'cc');
    await writeFixture(project.projectPath, '.env', 'SECRET=1');
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('lists files and directories without sizes', async () => {
    const result = await invokeTool(listDirectory, { path: '.' }, project.projectPath);
    const names = result.entries.map((e) => e.name).sort();
    expect(names).toEqual(['a.txt', 'b.txt', 'sub']);
  });

  it('filters out blocked files (.env)', async () => {
    const result = await invokeTool(listDirectory, { path: '.' }, project.projectPath);
    expect(result.entries.find((e) => e.name === '.env')).toBeUndefined();
  });

  it('includes sizes and summary when withSizes=true', async () => {
    const result = await invokeTool(
      listDirectory,
      { path: '.', withSizes: true },
      project.projectPath,
    );
    if (!('summary' in result)) throw new Error('expected summary');
    expect(result.summary?.totalFiles).toBe(2);
    expect(result.summary?.totalDirectories).toBe(1);
  });

  it('sorts by size descending when sortBy=size', async () => {
    const result = await invokeTool(
      listDirectory,
      { path: '.', withSizes: true, sortBy: 'size' },
      project.projectPath,
    );
    const sized = result.entries.filter((e) => e.type === 'file');
    expect(sized[0].name).toBe('b.txt'); // 4 bytes vs 2
  });
});
