import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { rcPath, ensureAnvilDirs } from './paths';

const RcSchema = z.object({
  provider: z.enum(['openai']).optional().default('openai'),
  model: z.string().optional().default('gpt-4o-mini'),
  embeddingModel: z.string().optional().default('text-embedding-3-large'),
  ignore: z.array(z.string()).optional().default(['.git','node_modules','dist','build','.anvil']),
  redact: z.array(z.string()).optional().default(['AWS_SECRET','PRIVATE_KEY','API_KEY']),
  maxContextBytes: z.number().optional().default(180_000)
});
export type Rc = z.infer<typeof RcSchema>;

export function loadRc(root = process.cwd()): Rc {
  ensureAnvilDirs(root);
  const p = rcPath(root);
  if (!fs.existsSync(p)) {
    const defaults = RcSchema.parse({});
    fs.writeFileSync(p, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return RcSchema.parse(raw);
}
