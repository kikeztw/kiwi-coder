import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { grepSearch } from '../../../src/tools/filesystem/grepSearch.js';
import { createTmpProject, writeFixture, type TmpProject } from '../../helpers/createTmpProject.js';
import { invokeTool } from '../../helpers/invokeTool.js';

describe('grepSearch', () => {
  let project: TmpProject;

  beforeEach(async () => {
    project = await createTmpProject();
    await writeFixture(project.projectPath, 'src/a.ts', 'export function fooBar() {}\n// hello');
    await writeFixture(project.projectPath, 'src/b.ts', 'const fooBar = 42;\nconst other = 1;');
    await writeFixture(project.projectPath, 'src/c.js', 'fooBar();');
    await writeFixture(project.projectPath, 'README.md', 'See fooBar.');
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it('finds literal matches across files', async () => {
    const result = await invokeTool(
      grepSearch,
      { query: 'fooBar', fixedStrings: true },
      project.projectPath,
    );
    expect(result.count).toBeGreaterThanOrEqual(4);
    const lines = result.matches.map((m) => m.text);
    expect(lines.some((t) => t.includes('export function fooBar'))).toBe(true);
  });

  it('filters by include glob', async () => {
    const result = await invokeTool(
      grepSearch,
      { query: 'fooBar', fixedStrings: true, includes: ['*.md'] },
      project.projectPath,
    );
    expect(result.matches.every((m) => m.path.endsWith('.md'))).toBe(true);
  });

  it('returns line numbers (1-indexed)', async () => {
    const result = await invokeTool(
      grepSearch,
      { query: 'hello', fixedStrings: true },
      project.projectPath,
    );
    expect(result.count).toBeGreaterThanOrEqual(1);
    const match = result.matches.find((m) => m.path.endsWith('a.ts'));
    expect(match?.line).toBe(2);
  });

  it('treats query as regex by default', async () => {
    const result = await invokeTool(
      grepSearch,
      { query: 'foo[A-Z]\\w+' },
      project.projectPath,
    );
    expect(result.count).toBeGreaterThan(0);
  });

  it('returns empty matches for non-existent pattern', async () => {
    const result = await invokeTool(
      grepSearch,
      { query: 'nonExistentPatternXYZ', fixedStrings: true },
      project.projectPath,
    );
    expect(result.count).toBe(0);
    expect(result.matches).toEqual([]);
  });
});
