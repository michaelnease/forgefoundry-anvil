import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadRc, Rc } from './config';
import { rcPath } from './paths';

describe('config', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anvil-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('loadRc', () => {
    it('should create default config if .anvilrc.json does not exist', () => {
      const rc = loadRc(testDir);
      
      expect(rc.provider).toBe('openai');
      expect(rc.model).toBe('gpt-4o-mini');
      expect(rc.embeddingModel).toBe('text-embedding-3-large');
      expect(rc.ignore).toContain('.git');
      expect(rc.ignore).toContain('node_modules');
      expect(rc.redact).toContain('AWS_SECRET');
      expect(rc.maxContextBytes).toBe(180_000);
      
      // Should have created the file
      expect(fs.existsSync(rcPath(testDir))).toBe(true);
    });

    it('should load existing config file', () => {
      const customConfig: Rc = {
        provider: 'openai',
        model: 'gpt-4',
        embeddingModel: 'text-embedding-3-small',
        ignore: ['.git', 'custom'],
        redact: ['SECRET'],
        maxContextBytes: 100_000
      };
      
      fs.writeFileSync(rcPath(testDir), JSON.stringify(customConfig, null, 2));
      
      const rc = loadRc(testDir);
      expect(rc.model).toBe('gpt-4');
      expect(rc.embeddingModel).toBe('text-embedding-3-small');
      expect(rc.ignore).toEqual(['.git', 'custom']);
      expect(rc.redact).toEqual(['SECRET']);
      expect(rc.maxContextBytes).toBe(100_000);
    });

    it('should use defaults for missing optional fields', () => {
      const partialConfig = {
        model: 'custom-model'
      };
      
      fs.writeFileSync(rcPath(testDir), JSON.stringify(partialConfig, null, 2));
      
      const rc = loadRc(testDir);
      expect(rc.model).toBe('custom-model');
      expect(rc.provider).toBe('openai'); // default
      expect(rc.embeddingModel).toBe('text-embedding-3-large'); // default
    });

    it('should validate and reject invalid config', () => {
      const invalidConfig = {
        provider: 'invalid-provider',
        model: 123 // invalid type
      };
      
      fs.writeFileSync(rcPath(testDir), JSON.stringify(invalidConfig, null, 2));
      
      expect(() => loadRc(testDir)).toThrow();
    });
  });
});

