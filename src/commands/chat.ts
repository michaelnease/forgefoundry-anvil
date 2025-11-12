import { Command } from 'commander';
import readline from 'readline';
import { search } from '../core/indexer';
import { answerWithLLM, Message } from '../core/llm';
import { loadRc } from '../core/config';
import chalk from 'chalk';
import stripAnsi from 'strip-ansi';
import { stagePatch } from '../core/patch';

export function chatCommand() {
  const cmd = new Command('chat')
    .description('Interactive chat about the repo')
    .option('-m, --model <name>', 'LLM model name override')
    .action(async (opts) => {
      const root = process.cwd();
      const rc = loadRc(root);
      const model = opts.model || rc.model;
      const apiKey = process.env.OPENAI_API_KEY;

      console.log(chalk.bold(`Anvil chat — model: ${model}${apiKey ? '' : ' (OPENAI_API_KEY not set, using local summaries)'}`));
      console.log(chalk.dim('Type your question. Type /exit to quit. Type /patch to stage a demo patch.'));

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: chalk.cyan('you> ') });
      const history: Message[] = [{
        role: 'system',
        content: 'You are Anvil, a code assistant. Be concise. When helpful, cite paths:lines that informed the answer.'
      }];

      rl.prompt();
      rl.on('line', async (line) => {
        const text = line.trim();
        if (!text) return rl.prompt();
        if (text === '/exit') { rl.close(); return; }
        if (text.startsWith('/patch')) {
          // Demo staged patch (user can later replace with LLM-generated diff)
          const demo = [
            'diff --git a/README.md b/README.md',
            'index 0000000..0000001 100644',
            '--- a/README.md',
            '+++ b/README.md',
            '@@ -1,3 +1,4 @@',
            ' # Project',
            ' A sample repo.',
            '+Anvil made a tiny change.',
            ''
          ].join('\n');
          stagePatch(root, demo);
          console.log(chalk.green('Staged a demo patch. Run `anvil diff` then `anvil apply` to apply it.'));
          return rl.prompt();
        }

        history.push({ role: 'user', content: text });

        // Retrieve related lines
        const hits = search(root, text).slice(0, 20);
        const facts = hits.map(h => `• ${h.path}:${h.line} — ${h.snippet}`).join('\n');
        const messages: Message[] = [
          ...history,
          { role: 'assistant', content: `Relevant code:
${facts || '(none found)'}` }
        ];

        const answer = await answerWithLLM(messages, { model, apiKey });
        console.log(chalk.yellowBright('anvil> ')+answer);
        history.push({ role: 'assistant', content: stripAnsi(answer) });

        rl.prompt();
      });
    });
  return cmd;
}
