import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { indexCommand } from './index';
import { loadRc } from '../core/config';
import { indexPath } from '../core/paths';
import { loadIndex } from '../core/indexer';

describe('index command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anvil-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);
    
    // Create test files
    fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'src', 'app.ts'), 'export function hello() {}');
    fs.writeFileSync(path.join(testDir, 'README.md'), '# Test');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should build index and display file count', async () => {
    const cmd = indexCommand();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await cmd.parseAsync(['index']);
    
    expect(fs.existsSync(indexPath(testDir))).toBe(true);
    const index = loadIndex(testDir);
    expect(index.files.length).toBeGreaterThan(0);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Indexed')
    );
    
    consoleSpy.mockRestore();
  });

  it('should respect ignore patterns from config', async () => {
    const rc = loadRc(testDir);
    rc.ignore.push('src/**');
    fs.writeFileSync(
      path.join(testDir, '.anvilrc.json'),
      JSON.stringify(rc, null, 2)
    );
    
    const cmd = indexCommand();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await cmd.parseAsync(['index']);
    
    const index = loadIndex(testDir);
    const srcFile = index.files.find((f: { path: string }) => f.path.startsWith('src/'));
    expect(srcFile).toBeUndefined();
  });
});

