import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  repoRoot,
  anvilDir,
  ensureAnvilDirs,
  rcPath,
  indexPath,
  stagedPatchPath
} from './paths';

describe('paths', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anvil-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('repoRoot', () => {
    it('should return current working directory by default', () => {
      const root = repoRoot();
      expect(root).toBe(process.cwd());
    });

    it('should return provided cwd', () => {
      const root = repoRoot(testDir);
      expect(root).toBe(testDir);
    });
  });

  describe('anvilDir', () => {
    it('should return .anvil directory path', () => {
      const dir = anvilDir(testDir);
      expect(dir).toBe(path.join(testDir, '.anvil'));
    });
  });

  describe('ensureAnvilDirs', () => {
    it('should create .anvil directory and subdirectories', () => {
      ensureAnvilDirs(testDir);
      
      const baseDir = anvilDir(testDir);
      expect(fs.existsSync(baseDir)).toBe(true);
      
      const subdirs = ['config', 'cache', 'history', 'patches', 'logs'];
      for (const subdir of subdirs) {
        const subdirPath = path.join(baseDir, subdir);
        expect(fs.existsSync(subdirPath)).toBe(true);
        expect(fs.statSync(subdirPath).isDirectory()).toBe(true);
      }
    });

    it('should not fail if directories already exist', () => {
      ensureAnvilDirs(testDir);
      ensureAnvilDirs(testDir); // Should not throw
      
      const baseDir = anvilDir(testDir);
      expect(fs.existsSync(baseDir)).toBe(true);
    });
  });

  describe('rcPath', () => {
    it('should return .anvilrc.json path', () => {
      const rc = rcPath(testDir);
      expect(rc).toBe(path.join(testDir, '.anvilrc.json'));
    });
  });

  describe('indexPath', () => {
    it('should return index.json path in cache directory', () => {
      const index = indexPath(testDir);
      expect(index).toBe(path.join(testDir, '.anvil', 'cache', 'index.json'));
    });
  });

  describe('stagedPatchPath', () => {
    it('should return last.patch path in patches directory', () => {
      const patch = stagedPatchPath(testDir);
      expect(patch).toBe(path.join(testDir, '.anvil', 'patches', 'last.patch'));
    });
  });
});

