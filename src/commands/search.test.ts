import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { searchCommand } from './search';
import { buildIndex } from '../core/indexer';

describe('search command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anvil-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);
    
    // Create test files
    fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'src', 'app.ts'), 'export function search() { return "found"; }');
    fs.writeFileSync(path.join(testDir, 'README.md'), '# Test\n\nSearch functionality');
    
    // Build index
    await buildIndex(testDir, []);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should search and display results', async () => {
    const cmd = searchCommand();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Commander requires the command name as first arg when parsing
    await cmd.parseAsync(['anvil', 'search', 'search']);
    
    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls;
    const hasResults = calls.some(call => 
      typeof call[0] === 'string' && call[0].includes('app.ts')
    );
    expect(hasResults).toBe(true);
    
    consoleSpy.mockRestore();
  });

  it('should handle multiple query words', async () => {
    const cmd = searchCommand();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await cmd.parseAsync(['anvil', 'search', 'function', 'search']);
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should display no results message when nothing found', async () => {
    const cmd = searchCommand();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await cmd.parseAsync(['anvil', 'search', 'nonexistentxyz123']);
    
    expect(consoleSpy).toHaveBeenCalledWith('(no results)');
    consoleSpy.mockRestore();
  });
});

