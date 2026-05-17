import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getFileInfo } from '../../../src/tools/filesystem/getFileInfo.js';
import { createTmpProject, writeFixture, type TmpProject } from '../../helpers/createTmpProject.js';
import { invokeTool } from '../../helpers/invokeTool.js';

describe('getFileInfo', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('returns metadata for a file', async () => {
    await writeFixture(project.projectPath, 'data.txt', 'hello');
    const info = await invokeTool(getFileInfo, { path: 'data.txt' }, project.projectPath);
    expect(info.size).toBe(5);
    expect(info.type).toBe('file');
    expect(info.permissions).toMatch(/^\d{3}$/);
    expect(typeof info.modified).toBe('string');
  });

  it('returns metadata for a directory', async () => {
    await writeFixture(project.projectPath, 'dir/inside.txt', 'x');
    const info = await invokeTool(getFileInfo, { path: 'dir' }, project.projectPath);
    expect(info.type).toBe('directory');
  });

  it('rejects path traversal', async () => {
    await expect(
      invokeTool(getFileInfo, { path: '../../etc/passwd' }, project.projectPath),
    ).rejects.toThrow(/Access denied/);
  });
});
