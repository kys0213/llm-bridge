import { describe, it, expect } from 'vitest';
import { OpenAIGpt4Bridge } from '../bridge/openai-gpt4-bridge';

describe('OpenAIGpt4Bridge', () => {
  it('should provide metadata', async () => {
    const bridge = new OpenAIGpt4Bridge('dummy');
    const meta = await bridge.getMetadata();
    expect(meta).toBeDefined();
    expect(meta.name).toBe('OpenAI GPT-4');
  });
});
