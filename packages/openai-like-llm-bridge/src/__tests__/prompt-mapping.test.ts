import { describe, it, expect } from 'vitest';
import { __internal } from '../bridge/openai-like-bridge';

describe('openai-like mapping', () => {
  it('maps messages to OpenAI format (text only)', () => {
    const msg = {
      role: 'user',
      content: [
        { contentType: 'text', value: 'Hello' },
        { contentType: 'image', value: Buffer.from('x') },
      ],
    } as any;
    const mapped = __internal.toOpenAiMessage(msg);
    expect(mapped).toEqual({ role: 'user', content: 'Hello' });
  });

  it('builds chat completions body', () => {
    const cfg = { baseUrl: 'http://localhost:8000/v1', model: 'gpt-3.5-turbo' } as any;
    const body = __internal.buildChatCompletionsRequest(
      [{ role: 'user', content: [{ contentType: 'text', value: 'Hi' }] } as any],
      cfg,
      { temperature: 0.2, topP: 0.9, maxTokens: 100 } as any
    );
    expect(body).toMatchObject({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hi' }],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 100,
      stream: false,
    });
  });

  it('maps full response to LlmBridgeResponse', () => {
    const json = {
      choices: [{ message: { content: 'Hello back' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    };
    const res = __internal.mapChatCompletionResponse(json);
    expect(res.content).toEqual({ contentType: 'text', value: 'Hello back' });
    expect(res.usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });
  });

  it('maps stream delta chunks', () => {
    const json = { choices: [{ delta: { content: 'He' } }] };
    const res = __internal.mapChatCompletionDelta(json);
    expect(res).toEqual({ content: { contentType: 'text', value: 'He' } });
  });
});
