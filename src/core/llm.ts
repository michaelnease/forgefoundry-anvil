import OpenAI from 'openai';

export type Message = { role: 'system'|'user'|'assistant'; content: string };

export async function answerWithLLM(messages: Message[], opts: { model: string, apiKey?: string }) {
  const { model, apiKey } = opts;
  if (!apiKey) {
    // Deterministic fallback
    const last = messages.filter(m=>m.role==='user').slice(-1)[0]?.content || '';
    return `Here is a deterministic local answer. You asked: "${last}".\n\n(Provide OPENAI_API_KEY to enable real model responses.)`;
  }
  const openai = new OpenAI({ apiKey });
  const resp = await openai.chat.completions.create({
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: 0.2
  });
  return resp.choices[0]?.message?.content || '(no answer)';
}
