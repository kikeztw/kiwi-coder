import { describe, it, expect } from 'vitest';
import * as path from 'path';
import {
  isBlockedFileName,
  resolvePath,
  validatePath,
  resolveAndValidatePath,
} from '../../../src/tools/shared/pathValidation.js';

describe('pathValidation', () => {
  const project = '/tmp/project';

  describe('isBlockedFileName', () => {
    it('blocks .env and variants', () => {
      expect(isBlockedFileName('.env')).toBe(true);
      expect(isBlockedFileName('.env.local')).toBe(true);
      expect(isBlockedFileName('.env.production')).toBe(true);
    });

    it('blocks .kiwi and .gitignore', () => {
      expect(isBlockedFileName('.kiwi')).toBe(true);
      expect(isBlockedFileName('.gitignore')).toBe(true);
    });

    it('does not block normal names', () => {
      expect(isBlockedFileName('src')).toBe(false);
      expect(isBlockedFileName('package.json')).toBe(false);
      expect(isBlockedFileName('readme.md')).toBe(false);
    });
  });

  describe('resolvePath', () => {
    it('returns absolute paths unchanged', () => {
      expect(resolvePath('/etc/hosts', project)).toBe(path.normalize('/etc/hosts'));
    });

    it('resolves relative paths against the project', () => {
      expect(resolvePath('src/index.ts', project)).toBe(path.resolve(project, 'src/index.ts'));
    });
  });

  describe('validatePath', () => {
    it('rejects paths outside the project (traversal)', () => {
      expect(() => validatePath('/etc/passwd', project)).toThrow(/Access denied/);
      expect(() => validatePath('/tmp/other', project)).toThrow(/Access denied/);
    });

    it('rejects paths containing blocked patterns', () => {
      expect(() => validatePath(path.join(project, '.env'), project)).toThrow(/protected/);
      expect(() => validatePath(path.join(project, 'src', '.env.local'), project)).toThrow(/protected/);
      expect(() => validatePath(path.join(project, '.kiwi', 'session.json'), project)).toThrow(/protected/);
    });

    it('accepts safe paths inside the project', () => {
      expect(() => validatePath(path.join(project, 'src/index.ts'), project)).not.toThrow();
    });
  });

  describe('resolveAndValidatePath', () => {
    it('rejects ../ traversal attempts', () => {
      expect(() => resolveAndValidatePath('../../etc/passwd', project)).toThrow(/Access denied/);
    });

    it('returns absolute path for valid input', () => {
      const result = resolveAndValidatePath('src/index.ts', project);
      expect(result).toBe(path.resolve(project, 'src/index.ts'));
    });
  });
});
