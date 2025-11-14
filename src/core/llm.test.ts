import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { answerWithLLM, Message } from './llm';

describe('llm', () => {
  const originalEnv = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.OPENAI_API_KEY = originalEnv;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  });

  describe('answerWithLLM', () => {
    it('should return deterministic fallback when no API key is provided', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'What is the meaning of life?' }
      ];
      
      const answer = await answerWithLLM(messages, { model: 'gpt-4o-mini' });
      
      expect(answer).toContain('deterministic local answer');
      expect(answer).toContain('What is the meaning of life?');
    });

    it('should extract last user message for fallback', async () => {
      const messages: Message[] = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer' },
        { role: 'user', content: 'Second question' }
      ];
      
      const answer = await answerWithLLM(messages, { model: 'gpt-4o-mini' });
      
      expect(answer).toContain('Second question');
      expect(answer).not.toContain('First question');
    });

    it('should handle empty messages array', async () => {
      const answer = await answerWithLLM([], { model: 'gpt-4o-mini' });
      
      expect(typeof answer).toBe('string');
      expect(answer.length).toBeGreaterThan(0);
    });

    it('should accept apiKey parameter', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test question' }
      ];
      
      // Mock OpenAI would be called here, but we'll test the fallback path
      // since we don't want to make real API calls in tests
      const answer = await answerWithLLM(messages, { 
        model: 'gpt-4o-mini',
        apiKey: undefined 
      });
      
      expect(answer).toContain('deterministic local answer');
    });

    it('should handle different message roles', async () => {
      const messages: Message[] = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User question' },
        { role: 'assistant', content: 'Assistant response' }
      ];
      
      const answer = await answerWithLLM(messages, { model: 'gpt-4o-mini' });
      
      expect(typeof answer).toBe('string');
    });
  });
});

