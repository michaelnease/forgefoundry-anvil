import { Command } from 'commander';
import { buildIndex } from '../core/indexer';
import { loadRc } from '../core/config';

export function indexCommand() {
  const cmd = new Command('index')
    .description('Build or refresh local index')
    .action(async () => {
      const root = process.cwd();
      const rc = loadRc(root);
      const files = await buildIndex(root, rc.ignore);
      console.log(`Indexed ${files.length} files.`);
    });
  return cmd;
}
