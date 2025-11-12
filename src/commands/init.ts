import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { ensureAnvilDirs, rcPath } from '../core/paths';

export function initCommand() {
  const cmd = new Command('init')
    .description('Initialize Anvil in this repo (creates .anvil/ and .anvilrc.json)')
    .action(async () => {
      const root = process.cwd();
      ensureAnvilDirs(root);
      const rc = rcPath(root);
      if (!fs.existsSync(rc)) {
        fs.writeFileSync(rc, JSON.stringify({
          provider: 'openai',
          model: 'gpt-4o-mini',
          embeddingModel: 'text-embedding-3-large',
          ignore: ['.git','node_modules','dist','build','.anvil'],
          redact: ['AWS_SECRET','PRIVATE_KEY','API_KEY'],
          maxContextBytes: 180000
        }, null, 2));
        console.log('Created', path.relative(root, rc));
      } else {
        console.log('.anvilrc.json already exists');
      }
      console.log('Initialized .anvil/ workspace');
    });
  return cmd;
}
