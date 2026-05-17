import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { multiEdit } from '../../../src/tools/filesystem/multiEdit.js';
import { createTmpProject, writeFixture, type TmpProject } from '../../helpers/createTmpProject.js';
import { invokeTool } from '../../helpers/invokeTool.js';

describe('multiEdit', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('applies sequential edits atomically', async () => {
    await writeFixture(project.projectPath, 'file.ts', 'A\nB\nC');
    await invokeTool(
      multiEdit,
      {
        path: 'file.ts',
        edits: [
          { oldString: 'A', newString: 'X' },
          { oldString: 'C', newString: 'Z' },
        ],
      },
      project.projectPath,
    );
    const onDisk = await fs.readFile(path.join(project.projectPath, 'file.ts'), 'utf-8');
    expect(onDisk).toBe('X\nB\nZ');
  });

  it('rolls back if any edit fails (no partial writes)', async () => {
    await writeFixture(project.projectPath, 'file.ts', 'A\nB\nC');
    await expect(
      invokeTool(
        multiEdit,
        {
          path: 'file.ts',
          edits: [
            { oldString: 'A', newString: 'X' },
            { oldString: 'NOT_THERE', newString: 'Y' },
          ],
        },
        project.projectPath,
      ),
    ).rejects.toThrow(/not found/);

    const onDisk = await fs.readFile(path.join(project.projectPath, 'file.ts'), 'utf-8');
    expect(onDisk).toBe('A\nB\nC');
  });

  it('applies edits in order, each over the previous result', async () => {
    await writeFixture(project.projectPath, 'file.ts', 'one');
    await invokeTool(
      multiEdit,
      {
        path: 'file.ts',
        edits: [
          { oldString: 'one', newString: 'two' },
          { oldString: 'two', newString: 'three' },
        ],
      },
      project.projectPath,
    );
    const onDisk = await fs.readFile(path.join(project.projectPath, 'file.ts'), 'utf-8');
    expect(onDisk).toBe('three');
  });
});
