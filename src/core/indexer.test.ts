import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { buildIndex, loadIndex, search, IndexedFile } from './indexer';
import { indexPath } from './paths';

describe('indexer', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anvil-test-'));
    
    // Create test files
    fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'src', 'app.ts'), 'export function hello() { return "world"; }');
    fs.writeFileSync(path.join(testDir, 'src', 'utils.ts'), 'export const API_KEY = "secret";');
    fs.writeFileSync(path.join(testDir, 'README.md'), '# Test Project\n\nThis is a test.');
    fs.writeFileSync(path.join(testDir, '.gitignore'), 'node_modules/\n*.log\n');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('buildIndex', () => {
    it('should index text files in the repository', async () => {
      const files = await buildIndex(testDir, []);
      
      expect(files.length).toBeGreaterThan(0);
      const appFile = files.find(f => f.path === 'src/app.ts');
      expect(appFile).toBeDefined();
      expect(appFile?.size).toBeGreaterThan(0);
    });

    it('should respect ignore patterns', async () => {
      const files = await buildIndex(testDir, ['src/**']);
      
      const appFile = files.find(f => f.path === 'src/app.ts');
      expect(appFile).toBeUndefined();
    });

    it('should respect .gitignore', async () => {
      fs.mkdirSync(path.join(testDir, 'node_modules'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'node_modules', 'test.js'), 'console.log("test");');
      
      const files = await buildIndex(testDir, []);
      
      const nodeModulesFile = files.find(f => f.path.startsWith('node_modules/'));
      expect(nodeModulesFile).toBeUndefined();
    });

    it('should skip large files', async () => {
      // Create a large file (>2MB)
      const largeContent = 'x'.repeat(3 * 1024 * 1024);
      fs.writeFileSync(path.join(testDir, 'large.txt'), largeContent);
      
      const files = await buildIndex(testDir, []);
      
      const largeFile = files.find(f => f.path === 'large.txt');
      expect(largeFile).toBeUndefined();
    });

    it('should skip binary files', async () => {
      fs.writeFileSync(path.join(testDir, 'image.png'), Buffer.from([0x89, 0x50, 0x4E, 0x47]));
      
      const files = await buildIndex(testDir, []);
      
      const imageFile = files.find(f => f.path === 'image.png');
      expect(imageFile).toBeUndefined();
    });

    it('should save index to file', async () => {
      await buildIndex(testDir, []);
      
      expect(fs.existsSync(indexPath(testDir))).toBe(true);
      const index = loadIndex(testDir);
      expect(index.root).toBe(testDir);
      expect(index.files.length).toBeGreaterThan(0);
    });
  });

  describe('loadIndex', () => {
    it('should load existing index', async () => {
      await buildIndex(testDir, []);
      
      const index = loadIndex(testDir);
      expect(index.root).toBe(testDir);
      expect(Array.isArray(index.files)).toBe(true);
    });

    it('should return empty index if file does not exist', () => {
      const index = loadIndex(testDir);
      expect(index.root).toBe(testDir);
      expect(index.files).toEqual([]);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await buildIndex(testDir, []);
    });

    it('should find matches in indexed files', () => {
      const hits = search(testDir, 'hello');
      
      expect(hits.length).toBeGreaterThan(0);
      const hit = hits.find(h => h.path === 'src/app.ts');
      expect(hit).toBeDefined();
      expect(hit?.snippet).toContain('hello');
    });

    it('should return empty array for empty query', () => {
      const hits = search(testDir, '');
      expect(hits).toEqual([]);
    });

    it('should handle regex special characters safely', () => {
      const hits = search(testDir, '[');
      // Should not throw
      expect(Array.isArray(hits)).toBe(true);
    });

    it('should respect limit parameter', () => {
      // Create multiple matching files
      for (let i = 0; i < 10; i++) {
        fs.writeFileSync(
          path.join(testDir, `test${i}.ts`),
          `export const test${i} = "hello world";`
        );
      }
      
      // Rebuild index
      buildIndex(testDir, []).then(() => {
        const hits = search(testDir, 'hello', 5);
        expect(hits.length).toBeLessThanOrEqual(5);
      });
    });

    it('should return line numbers and snippets', () => {
      const hits = search(testDir, 'world');
      
      if (hits.length > 0) {
        const hit = hits[0];
        expect(hit.path).toBeDefined();
        expect(hit.line).toBeGreaterThan(0);
        expect(hit.snippet).toBeDefined();
        expect(hit.snippet.length).toBeLessThanOrEqual(300);
      }
    });
  });
});

