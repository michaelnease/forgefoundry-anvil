import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { initCommand } from './init';
import { rcPath, anvilDir } from '../core/paths';

describe('init command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anvil-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create .anvilrc.json if it does not exist', async () => {
    const cmd = initCommand();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await cmd.parseAsync(['init']);
    
    expect(fs.existsSync(rcPath(testDir))).toBe(true);
    const config = JSON.parse(fs.readFileSync(rcPath(testDir), 'utf-8'));
    expect(config.provider).toBe('openai');
    expect(config.model).toBe('gpt-4o-mini');
    
    consoleSpy.mockRestore();
  });

  it('should create .anvil directory structure', async () => {
    const cmd = initCommand();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await cmd.parseAsync(['init']);
    
    expect(fs.existsSync(anvilDir(testDir))).toBe(true);
    const subdirs = ['config', 'cache', 'history', 'patches', 'logs'];
    for (const subdir of subdirs) {
      expect(fs.existsSync(path.join(anvilDir(testDir), subdir))).toBe(true);
    }
  });

  it('should not overwrite existing .anvilrc.json', async () => {
    const existingConfig = { provider: 'openai', model: 'custom-model' };
    fs.writeFileSync(rcPath(testDir), JSON.stringify(existingConfig, null, 2));
    
    const cmd = initCommand();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await cmd.parseAsync(['init']);
    
    const config = JSON.parse(fs.readFileSync(rcPath(testDir), 'utf-8'));
    expect(config.model).toBe('custom-model');
    expect(consoleSpy).toHaveBeenCalledWith('.anvilrc.json already exists');
    
    consoleSpy.mockRestore();
  });
});

