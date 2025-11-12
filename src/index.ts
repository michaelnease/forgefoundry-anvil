import { Command } from 'commander';
import { initCommand } from './commands/init';
import { indexCommand } from './commands/index';
import { chatCommand } from './commands/chat';
import { searchCommand } from './commands/search';
import { diffCommand } from './commands/diff';
import { applyCommand } from './commands/apply';

const program = new Command();
program
  .name('anvil')
  .description('Anvil — repo-agnostic AI code assistant CLI')
  .version('0.1.0');

program.addCommand(initCommand());
program.addCommand(indexCommand());
program.addCommand(searchCommand());
program.addCommand(chatCommand());
program.addCommand(diffCommand());
program.addCommand(applyCommand());

program.parseAsync(process.argv);
