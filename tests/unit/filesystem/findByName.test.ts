import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { findByName } from '../../../src/tools/filesystem/findByName.js';
import { createTmpProject, writeFixture, type TmpProject } from '../../helpers/createTmpProject.js';
import { invokeTool } from '../../helpers/invokeTool.js';

describe('findByName', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
    await writeFixture(project.projectPath, 'src/a.ts', '');
    await writeFixture(project.projectPath, 'src/b.ts', '');
    await writeFixture(project.projectPath, 'src/components/c.tsx', '');
    await writeFixture(project.projectPath, 'src/utils/helper.js', '');
    await writeFixture(project.projectPath, 'tests/x.test.ts', '');
    await writeFixture(project.projectPath, 'README.md', '');
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('finds files matching a glob pattern', async () => {
    const result = await invokeTool(
      findByName,
      { searchDirectory: '.', pattern: '*.ts' },
      project.projectPath,
    );
    const names = result.matches.map((m) => m.name).sort();
    expect(names).toContain('a.ts');
    expect(names).toContain('b.ts');
    expect(names).toContain('x.test.ts');
    expect(names).not.toContain('README.md');
  });

  it('filters by extensions', async () => {
    const result = await invokeTool(
      findByName,
      { searchDirectory: '.', extensions: ['tsx'] },
      project.projectPath,
    );
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].name).toBe('c.tsx');
  });

  it('filters by type', async () => {
    const result = await invokeTool(
      findByName,
      { searchDirectory: '.', type: 'directory' },
      project.projectPath,
    );
    const names = result.matches.map((m) => m.name);
    expect(names).toContain('src');
    expect(names).toContain('tests');
    expect(names.every((_, i) => result.matches[i].type === 'directory')).toBe(true);
  });

  it('respects maxDepth', async () => {
    const result = await invokeTool(
      findByName,
      { searchDirectory: '.', pattern: '*.ts', maxDepth: 1 },
      project.projectPath,
    );
    const names = result.matches.map((m) => m.name);
    expect(names).not.toContain('x.test.ts'); // is at depth 2 (tests/x.test.ts)
  });

  it('excludes by substring', async () => {
    const result = await invokeTool(
      findByName,
      { searchDirectory: '.', pattern: '*.ts', excludes: ['test'] },
      project.projectPath,
    );
    const names = result.matches.map((m) => m.name);
    expect(names).not.toContain('x.test.ts');
  });
});
