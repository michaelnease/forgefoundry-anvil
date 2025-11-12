import { Command } from 'commander';
import { applyStagedPatch } from '../core/patch';

export function applyCommand() {
  const cmd = new Command('apply')
    .description('Apply the staged unified diff to the working tree')
    .action(async () => {
      const root = process.cwd();
      try {
        applyStagedPatch(root);
        console.log('Applied staged patch.');
      } catch (e: any) {
        console.error('Failed to apply patch:', e?.message || e);
        process.exitCode = 1;
      }
    });
  return cmd;
}
