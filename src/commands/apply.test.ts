import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { applyCommand } from './apply';
import { stagePatch } from '../core/patch';

describe('apply command', () => {
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

  it('should apply staged patch successfully', async () => {
    const filePath = path.join(testDir, 'test.txt');
    fs.writeFileSync(filePath, 'original');
    
    const patch = [
      'diff --git a/test.txt b/test.txt',
      '--- a/test.txt',
      '+++ b/test.txt',
      '@@ -1 +1,2 @@',
      ' original',
      '+added'
    ].join('\n');
    
    stagePatch(testDir, patch);
    
    const cmd = applyCommand();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await cmd.parseAsync(['apply']);
    
    expect(fs.readFileSync(filePath, 'utf-8')).toContain('added');
    expect(consoleSpy).toHaveBeenCalledWith('Applied staged patch.');
    
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    const originalExitCode = process.exitCode;
    process.exitCode = undefined;
    
    const cmd = applyCommand();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await cmd.parseAsync(['apply']);
    
    expect(errorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    
    process.exitCode = originalExitCode;
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

