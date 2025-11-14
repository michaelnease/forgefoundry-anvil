import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { stagePatch, showStagedPatch, applyStagedPatch } from './patch';
import { stagedPatchPath } from './paths';

describe('patch', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anvil-test-'));
    fs.mkdirSync(path.join(testDir, '.anvil', 'patches'), { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('stagePatch', () => {
    it('should save patch to file', () => {
      const patch = 'diff --git a/test.txt b/test.txt\n--- a/test.txt\n+++ b/test.txt\n@@ -1 +1,2 @@\n hello\n+world';
      
      stagePatch(testDir, patch);
      
      expect(fs.existsSync(stagedPatchPath(testDir))).toBe(true);
      const saved = fs.readFileSync(stagedPatchPath(testDir), 'utf-8');
      expect(saved).toBe(patch);
    });

    it('should create patches directory if it does not exist', () => {
      const patchDir = path.dirname(stagedPatchPath(testDir));
      fs.rmSync(patchDir, { recursive: true, force: true });
      
      const patch = 'test patch';
      stagePatch(testDir, patch);
      
      expect(fs.existsSync(stagedPatchPath(testDir))).toBe(true);
    });
  });

  describe('showStagedPatch', () => {
    it('should return staged patch content', () => {
      const patch = 'diff --git a/test.txt b/test.txt\n--- a/test.txt\n+++ b/test.txt\n@@ -1 +1,2 @@\n hello\n+world';
      stagePatch(testDir, patch);
      
      const shown = showStagedPatch(testDir);
      expect(shown).toBe(patch);
    });

    it('should return empty string if no patch exists', () => {
      const shown = showStagedPatch(testDir);
      expect(shown).toBe('');
    });
  });

  describe('applyStagedPatch', () => {
    it('should apply patch to existing file', () => {
      const originalContent = 'hello\nworld';
      const filePath = path.join(testDir, 'test.txt');
      fs.writeFileSync(filePath, originalContent);
      
      const patch = [
        'diff --git a/test.txt b/test.txt',
        'index 0000000..1111111 100644',
        '--- a/test.txt',
        '+++ b/test.txt',
        '@@ -1,2 +1,3 @@',
        ' hello',
        ' world',
        '+new line'
      ].join('\n');
      
      stagePatch(testDir, patch);
      applyStagedPatch(testDir);
      
      const result = fs.readFileSync(filePath, 'utf-8');
      expect(result).toContain('new line');
    });

    it('should create new file from patch', () => {
      const patch = [
        'diff --git a/new.txt b/new.txt',
        'new file mode 100644',
        'index 0000000..1111111',
        '--- /dev/null',
        '+++ b/new.txt',
        '@@ -0,0 +1,2 @@',
        '+hello',
        '+world'
      ].join('\n');
      
      stagePatch(testDir, patch);
      applyStagedPatch(testDir);
      
      const filePath = path.join(testDir, 'new.txt');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('hello');
    });

    it('should throw error if no patch exists', () => {
      expect(() => applyStagedPatch(testDir)).toThrow('No staged patch found');
    });

    it('should handle multi-file patches', () => {
      const file1Path = path.join(testDir, 'file1.txt');
      const file2Path = path.join(testDir, 'file2.txt');
      fs.writeFileSync(file1Path, 'original1');
      fs.writeFileSync(file2Path, 'original2');
      
      const patch = [
        'diff --git a/file1.txt b/file1.txt',
        '--- a/file1.txt',
        '+++ b/file1.txt',
        '@@ -1 +1,2 @@',
        ' original1',
        '+added1',
        'diff --git a/file2.txt b/file2.txt',
        '--- a/file2.txt',
        '+++ b/file2.txt',
        '@@ -1 +1,2 @@',
        ' original2',
        '+added2'
      ].join('\n');
      
      stagePatch(testDir, patch);
      applyStagedPatch(testDir);
      
      expect(fs.readFileSync(file1Path, 'utf-8')).toContain('added1');
      expect(fs.readFileSync(file2Path, 'utf-8')).toContain('added2');
    });

    it('should create parent directories for new files', () => {
      const patch = [
        'diff --git a/subdir/new.txt b/subdir/new.txt',
        'new file mode 100644',
        '--- /dev/null',
        '+++ b/subdir/new.txt',
        '@@ -0,0 +1 @@',
        '+content'
      ].join('\n');
      
      stagePatch(testDir, patch);
      applyStagedPatch(testDir);
      
      const filePath = path.join(testDir, 'subdir', 'new.txt');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

