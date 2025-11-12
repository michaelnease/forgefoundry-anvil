import fs from 'fs';
import path from 'path';
import { stagedPatchPath } from './paths';
import { applyPatch } from 'diff';

export function stagePatch(root: string, unifiedDiff: string) {
  fs.mkdirSync(path.dirname(stagedPatchPath(root)), { recursive: true });
  fs.writeFileSync(stagedPatchPath(root), unifiedDiff);
}

export function showStagedPatch(root: string): string {
  const p = stagedPatchPath(root);
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf-8');
}

export function applyStagedPatch(root: string) {
  const p = stagedPatchPath(root);
  if (!fs.existsSync(p)) throw new Error('No staged patch found. Run `anvil diff` or create a patch first.');
  const patch = fs.readFileSync(p, 'utf-8');

  // Very simple multi-file patch apply
  const filePatches = splitFiles(patch);
  for (const fp of filePatches) {
    const abs = path.join(root, fp.target);
    const original = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : '';
    const result = applyPatch(original, fp.diff);
    if (result === false) {
      throw new Error(`Failed to apply patch for ${fp.target}`);
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, result);
  }
}

function splitFiles(unified: string): { target: string; diff: string }[] {
  const parts = unified.split(/^diff --git /m).filter(Boolean);
  const out: { target: string; diff: string }[] = [];
  for (const part of parts) {
    const lines = part.split(/\r?\n/);
    // Parse a/ and b/ paths from 'a/...' 'b/...'
    const header = lines[0] || '';
    const match = header.match(/^a\/(\S+) b\/(\S+)/);
    const target = match?.[2] || match?.[1] || '';
    out.push({ target, diff: 'diff --git ' + part });
  }
  return out;
}
