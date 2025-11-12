import { Command } from 'commander';
import { showStagedPatch } from '../core/patch';

export function diffCommand() {
  const cmd = new Command('diff')
    .description('Show the currently staged unified diff')
    .action(async () => {
      const root = process.cwd();
      const patch = showStagedPatch(root);
      if (!patch) console.log('(no staged patch)');
      else console.log(patch);
    });
  return cmd;
}
