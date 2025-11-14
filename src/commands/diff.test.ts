import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { diffCommand } from './diff';
import { stagePatch } from '../core/patch';

describe('diff command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anvil-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);
    fs.mkdirSync(path.join(testDir, '.anvil', 'patches'), { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should display staged patch', async () => {
    const patch = 'diff --git a/test.txt b/test.txt\n--- a/test.txt\n+++ b/test.txt\n@@ -1 +1,2 @@\n hello\n+world';
    stagePatch(testDir, patch);
    
    const cmd = diffCommand();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await cmd.parseAsync(['diff']);
    
    expect(consoleSpy).toHaveBeenCalledWith(patch);
    consoleSpy.mockRestore();
  });

  it('should display no patch message when none exists', async () => {
    const cmd = diffCommand();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await cmd.parseAsync(['diff']);
    
    expect(consoleSpy).toHaveBeenCalledWith('(no staged patch)');
    consoleSpy.mockRestore();
  });
});

