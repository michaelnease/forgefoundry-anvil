import { Command } from 'commander';
import { search } from '../core/indexer';

export function searchCommand() {
  const cmd = new Command('search')
    .description('Search the local index (regex or keyword)')
    .argument('<query...>', 'query words or regex')
    .action(async (queryParts: string[]) => {
      const root = process.cwd();
      const query = queryParts.join(' ');
      const hits = search(root, query);
      for (const h of hits.slice(0, 100)) {
        console.log(`${h.path}:${h.line}  ${h.snippet}`);
      }
      if (!hits.length) console.log('(no results)');
    });
  return cmd;
}
