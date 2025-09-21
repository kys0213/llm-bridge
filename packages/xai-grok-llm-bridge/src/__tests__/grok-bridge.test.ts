import { describe, expect, it } from 'vitest';
import type { Message } from 'llm-bridge-spec';
import {
  buildChatCompletionRequest,
  mapChatCompletionDelta,
  mapChatCompletionResponse,
  parseSseEvent,
  toGrokMessage,
} from '../bridge/grok-internals';
import type { GrokConfig } from '../bridge/types';

describe('Grok bridge mappings', () => {
  it('converts messages to Grok format using text content', () => {
    const message: Message = {
      role: 'user',
      content: [
        { contentType: 'text', value: 'Hello Grok' },
        { contentType: 'image', value: Buffer.from('fake') },
      ],
    };

    const mapped = toGrokMessage(message);
    expect(mapped).toEqual({ role: 'user', content: 'Hello Grok' });
  });

  it('builds chat completion request with snake_case options', () => {
    const config: GrokConfig = {
      apiKey: 'token',
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-3-latest',
      timeoutMs: 60_000,
      temperature: 0.2,
      topP: 0.9,
      maxTokens: 1024,
      frequencyPenalty: 0.3,
      presencePenalty: -0.2,
      stopSequences: ['END'],
      reasoningEffort: 'high',
      search: {
        mode: 'on',
        returnCitations: true,
        sources: [{ type: 'web', country: 'US' }],
      },
      toolChoice: { type: 'function', toolName: 'get_weather' },
      parallelToolCalls: true,
      responseFormat: { type: 'json_object' },
      conversationId: 'conv-123',
      user: 'user-1',
      storeMessages: true,
      seed: 42,
    };

    const messages: Message[] = [
      { role: 'user', content: [{ contentType: 'text', value: 'Hello' }] },
    ];
    const tools = [
      {
        name: 'get_weather',
        description: 'Fetch weather',
        parameters: { type: 'object' },
      },
    ];

    const body = buildChatCompletionRequest(config, messages, {
      tools,
      temperature: 0.5,
      stream: false,
    });

    expect(body).toMatchObject({
      model: 'grok-3-latest',
      temperature: 0.5,
      top_p: 0.9,
      max_tokens: 1024,
      frequency_penalty: 0.3,
      presence_penalty: -0.2,
      stop: ['END'],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Fetch weather',
            parameters: { type: 'object' },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'get_weather' } },
      search_parameters: {
        mode: 'on',
        return_citations: true,
        sources: [
          {
            type: 'web',
            country: 'US',
          },
        ],
      },
      conversation_id: 'conv-123',
      user: 'user-1',
      seed: 42,
    });
  });

  it('maps full Grok response including reasoning and citations', () => {
    const json = {
      choices: [
        {
          message: {
            content: 'Final answer',
            reasoning_content: 'Chain of thought summary',
            tool_calls: [
              {
                id: 'tool-1',
                type: 'function',
                function: { name: 'lookup', arguments: '{"city":"Seoul"}' },
              },
            ],
          },
        },
      ],
      usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
      citations: ['https://example.com'],
    };

    const res = mapChatCompletionResponse(json);
    expect(res.content).toEqual({
      contentType: 'text',
      value: expect.stringContaining('Final answer'),
    });
    expect(res.content.value).toContain('Reasoning:');
    expect(res.content.value).toContain('https://example.com');
    expect(res.usage).toEqual({ promptTokens: 12, completionTokens: 8, totalTokens: 20 });
    expect(res.toolCalls).toEqual([
      {
        toolCallId: 'tool-1',
        name: 'lookup',
        arguments: { city: 'Seoul' },
      },
    ]);
  });

  it('parses streaming delta chunks', () => {
    const deltas = mapChatCompletionDelta({
      choices: [
        {
          delta: {
            content: 'Hello',
            reasoning_content: 'Thinking',
          },
        },
      ],
      usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
    });

    expect(deltas[0]).toEqual({
      content: { contentType: 'text', value: 'Hello\n\nThinking' },
    });
    expect(deltas[1]).toEqual({
      content: { contentType: 'text', value: '' },
      usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
    });
  });

  it('surfaces tool call deltas from streaming chunks', () => {
    const deltas = mapChatCompletionDelta({
      choices: [
        {
          delta: {
            tool_calls: [
              {
                id: 'call-1',
                type: 'function',
                function: { name: 'lookup', arguments: '{"query":"weather"}' },
              },
            ],
          },
        },
      ],
    });

    expect(deltas).toEqual([
      {
        content: { contentType: 'text', value: '' },
        toolCalls: [
          {
            toolCallId: 'call-1',
            name: 'lookup',
            arguments: { query: 'weather' },
          },
        ],
      },
    ]);
  });

  it('parses SSE event payloads', () => {
    const event = parseSseEvent('event: message\ndata: {"foo":"bar"}');
    expect(event).toEqual({ event: 'message', data: '{"foo":"bar"}' });
  });
});
