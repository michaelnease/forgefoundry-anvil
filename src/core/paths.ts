import path from 'path';
import fs from 'fs';

export function repoRoot(cwd = process.cwd()): string {
  return cwd;
}

export function anvilDir(root = repoRoot()): string {
  return path.join(root, '.anvil');
}

export function ensureAnvilDirs(root = repoRoot()) {
  const base = anvilDir(root);
  const sub = ['config','cache','history','patches','logs'];
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  for (const s of sub) {
    const p = path.join(base, s);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
}

export function rcPath(root = repoRoot()) {
  return path.join(root, '.anvilrc.json');
}

export function indexPath(root = repoRoot()) {
  return path.join(anvilDir(root), 'cache', 'index.json');
}

export function stagedPatchPath(root = repoRoot()) {
  return path.join(anvilDir(root), 'patches', 'last.patch');
}
