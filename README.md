# @forge/anvil — AI code assistant CLI

Anvil is a developer-first CLI that indexes your repo locally, lets you **chat in the terminal**, and proposes **unified diffs** you can review and apply.

## Install

```bash
npm i -g @forge/anvil
# or
npx @forge/anvil@latest chat
```

## Quick start

```bash
cd /path/to/your/repo
anvil init          # creates .anvil/ workspace and config
anvil index         # builds a local search index
anvil chat          # interactive chat about your code
anvil search auth   # ad-hoc search
anvil diff          # show last proposed patch
anvil apply         # apply staged patch to the working tree
```

> OpenAI is optional. If you set `OPENAI_API_KEY`, Anvil can phrase richer answers and propose diffs. Without it, chat uses local retrieval and deterministic summaries.

## Config

Per-repo config lives in `.anvilrc.json` and `.anvil/config/`:

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "embeddingModel": "text-embedding-3-large",
  "ignore": [".git", "node_modules", "dist", "build"],
  "redact": ["AWS_SECRET", "PRIVATE_KEY", "API_KEY"],
  "maxContextBytes": 180000
}
```

## Safety

- Respects `.gitignore`
- Skips binaries by extension and size
- Never writes changes without `anvil apply`
- Stores everything under `.anvil/`

## License

MIT
