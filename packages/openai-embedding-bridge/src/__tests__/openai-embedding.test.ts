import OpenAI from 'openai';
import type { CreateEmbeddingResponse } from 'openai/resources/embeddings';
import { describe, expect, it } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { OpenAIEmbeddingBridge } from '../bridge/openai-embedding-bridge';
import { createOpenAIEmbeddingBridge } from '../bridge/openai-embedding-factory';
import { OpenAIEmbeddingConfig } from '../bridge/openai-embedding-config';

describe('OpenAIEmbeddingBridge', () => {
  const config: OpenAIEmbeddingConfig = {
    apiKey: 'test-key',
    model: 'text-embedding-3-small',
  };

  it('should create embedding for text input', async () => {
    const mockClient = mockDeep<OpenAI>();
    const bridge = new OpenAIEmbeddingBridge(mockClient, config);
    const mockResponse: CreateEmbeddingResponse = {
      data: [{ embedding: [0.1, 0.2, 0.3], index: 0, object: 'embedding' }],
      model: 'text-embedding-3-small',
      object: 'list',
      usage: { prompt_tokens: 5, total_tokens: 5 },
    };
    mockClient.embeddings.create.mockResolvedValue(mockResponse);

    const res = await bridge.embed({ input: 'hello' });
    expect(res.embeddings).toEqual([0.1, 0.2, 0.3]);
    expect(res.usage).toEqual({ promptTokens: 5 });
  });

  it('should support array input', async () => {
    const mockClient = mockDeep<OpenAI>();
    const bridge = new OpenAIEmbeddingBridge(mockClient, config);
    const mockResponse: CreateEmbeddingResponse = {
      data: [
        { embedding: [0.1, 0.2], index: 0, object: 'embedding' },
        { embedding: [0.3, 0.4], index: 1, object: 'embedding' },
      ],
      model: 'text-embedding-3-small',
      object: 'list',
      usage: { prompt_tokens: 10, total_tokens: 10 },
    };
    mockClient.embeddings.create.mockResolvedValue(mockResponse);

    const res = await bridge.embed({ input: ['a', 'b'] });
    expect(res.embeddings).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    expect(res.usage).toEqual({ promptTokens: 10 });
  });

  it('should forward configured dimension to OpenAI API', async () => {
    const mockClient = mockDeep<OpenAI>();
    const bridge = new OpenAIEmbeddingBridge(mockClient, {
      ...config,
      dimension: 256,
    });
    const mockResponse: CreateEmbeddingResponse = {
      data: [{ embedding: new Array(256).fill(0), index: 0, object: 'embedding' }],
      model: 'text-embedding-3-small',
      object: 'list',
      usage: { prompt_tokens: 0, total_tokens: 0 },
    };
    mockClient.embeddings.create.mockResolvedValue(mockResponse);

    await bridge.embed({ input: 'hello' });
    expect(mockClient.embeddings.create).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'hello',
      dimensions: 256,
    });
  });

  it('factory should validate config', () => {
    expect(() => createOpenAIEmbeddingBridge({ apiKey: 'key' })).not.toThrow();
  });

  it('getMetadata should return model info', async () => {
    const mockClient = mockDeep<OpenAI>();
    const bridge = new OpenAIEmbeddingBridge(mockClient, config);
    const meta = await bridge.getMetadata();
    expect(meta).toEqual({ model: 'text-embedding-3-small', dimension: 1536 });
  });
});
