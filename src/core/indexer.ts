import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import ignore from 'ignore';
import { indexPath } from './paths';

export type IndexedFile = { path: string; size: number; mtimeMs: number };
export type SearchHit = { path: string; line: number; snippet: string };

const TEXT_EXTS = new Set([
  '.ts','.tsx','.js','.jsx','.json','.md','.yml','.yaml','.css','.scss','.html','.txt','.py','.java','.go','.rs','.c','.cpp','.cs','.sh','.toml'
]);

export async function buildIndex(root: string, ignoreGlobs: string[]) {
  const gitignorePath = path.join(root, '.gitignore');
  const ig = ignore();
  if (fs.existsSync(gitignorePath)) {
    ig.add(fs.readFileSync(gitignorePath, 'utf-8'));
  }
  ig.add(ignoreGlobs || []);

  const entries = await fg(['**/*'], { cwd: root, dot: false, absolute: true });
  const files: IndexedFile[] = [];
  for (const abs of entries) {
    const rel = path.relative(root, abs);
    if (ig.ignores(rel)) continue;
    const stat = fs.statSync(abs);
    if (!stat.isFile()) continue;
    if (stat.size > 2 * 1024 * 1024) continue; // skip >2MB
    const ext = path.extname(abs).toLowerCase();
    if (!TEXT_EXTS.has(ext)) continue;
    files.push({ path: rel, size: stat.size, mtimeMs: stat.mtimeMs });
  }
  fs.mkdirSync(path.dirname(indexPath(root)), { recursive: true });
  fs.writeFileSync(indexPath(root), JSON.stringify({ root, files }, null, 2));
  return files;
}

export function loadIndex(root: string): { root: string; files: IndexedFile[] } {
  const p = indexPath(root);
  if (!fs.existsSync(p)) return { root, files: [] };
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function search(root: string, query: string, limit = 200): SearchHit[] {
  const idx = loadIndex(root);
  if (!query) return [];
  const re = safeRegex(query);
  const hits: SearchHit[] = [];
  for (const f of idx.files) {
    const abs = path.join(root, f.path);
    const text = fs.readFileSync(abs, 'utf-8');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (re.test(line)) {
        hits.push({ path: f.path, line: i + 1, snippet: line.trim().slice(0, 300) });
      }
      re.lastIndex = 0;
    }
    if (hits.length >= limit) break;
  }
  return hits.slice(0, limit);
}

function safeRegex(q: string) {
  try { return new RegExp(q, 'i'); }
  catch { return new RegExp(q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'); }
}
