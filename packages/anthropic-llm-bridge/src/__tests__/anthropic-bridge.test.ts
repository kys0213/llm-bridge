import { LlmBridgePrompt, LlmBridgeTool } from 'llm-bridge-spec';
import Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { AnthropicBridge } from '../bridge/anthropic-bridge';
import { AnthropicConfig, AnthropicConfigSchema } from '../bridge/anthropic-config';
import { createAnthropicBridge } from '../bridge/anthropic-factory';
import { AnthropicModelEnum } from '../bridge/anthropic-models';

describe('AnthropicBridge', () => {
  const config: AnthropicConfig = {
    apiKey: 'test-api-key',
    model: AnthropicModelEnum.CLAUDE_SONNET_4,
    temperature: 0.7,
    maxTokens: 8192,
  };

  describe('constructor', () => {
    it('올바른 설정으로 브릿지를 생성해야 함', () => {
      const mockClient = mockDeep<Anthropic>();
      const bridge = new AnthropicBridge(mockClient, config);

      expect(bridge).toBeInstanceOf(AnthropicBridge);
    });

    it('기본 모델을 사용해야 함 (model이 설정되지 않은 경우)', () => {
      const mockClient = mockDeep<Anthropic>();
      const configWithoutModel = { ...config };
      delete configWithoutModel.model;

      const bridge = new AnthropicBridge(mockClient, configWithoutModel);

      expect(bridge).toBeInstanceOf(AnthropicBridge);
    });
  });

  describe('invoke', () => {
    it('기본적인 텍스트 프롬프트로 응답을 생성해야 함', async () => {
      const mockClient = mockDeep<Anthropic>();
      const bridge = new AnthropicBridge(mockClient, config);
      const prompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: [{ contentType: 'text', value: 'Hello, Claude!' }],
          },
        ],
      };

      const mockResponse = {
        id: 'msg_test',
        type: 'message' as const,
        role: 'assistant' as const,
        model: 'claude-sonnet-4',
        content: [
          {
            type: 'text' as const,
            text: 'Hello! How can I assist you today?',
          },
        ],
        usage: {
          input_tokens: 10,
          output_tokens: 8,
        },
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const response = await bridge.invoke(prompt);

      expect(response.content).toEqual({
        contentType: 'text',
        value: 'Hello! How can I assist you today?',
      });
      expect(response.usage).toEqual({
        promptTokens: 10,
        completionTokens: 8,
        totalTokens: 18,
      });
    });

    it('도구 호출을 지원해야 함', async () => {
      const mockClient = mockDeep<Anthropic>();
      const bridge = new AnthropicBridge(mockClient, config);
      const prompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: [{ contentType: 'text', value: 'What is the weather like?' }],
          },
        ],
      };

      const mockResponse = {
        id: 'msg_test',
        type: 'message' as const,
        role: 'assistant' as const,
        model: 'claude-sonnet-4',
        content: [
          {
            type: 'tool_use' as const,
            id: 'toolu_test',
            name: 'get_weather',
            input: { location: 'New York' },
          },
        ],
        usage: {
          input_tokens: 15,
          output_tokens: 10,
        },
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const response = await bridge.invoke(prompt, {
        tools: [
          {
            name: 'get_weather',
            description: 'Get weather information',
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string' },
              },
              required: ['location'],
            },
          } as LlmBridgeTool,
        ],
      });

      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls![0]).toEqual({
        toolCallId: 'toolu_test',
        name: 'get_weather',
        arguments: { location: 'New York' },
      });
    });

    it('긴 컨텍스트 헤더를 설정해야 함', async () => {
      const mockClient = mockDeep<Anthropic>();
      const longContextConfig = {
        ...config,
        useLongContext: true,
        useExtendedOutput: true,
      };
      const bridge = new AnthropicBridge(mockClient, longContextConfig);
      const prompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: [{ contentType: 'text', value: 'Test long context' }],
          },
        ],
      };

      const mockResponse = {
        id: 'msg_test',
        type: 'message' as const,
        role: 'assistant' as const,
        model: 'claude-sonnet-4',
        content: [
          {
            type: 'text' as const,
            text: 'Response',
          },
        ],
        usage: {
          input_tokens: 5,
          output_tokens: 3,
        },
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      await bridge.invoke(prompt);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'anthropic-beta': expect.stringContaining('context-1m-2025-08-07'),
          }),
        })
      );
    });
  });

  describe('getMetadata', () => {
    it('Claude Sonnet 4 모델의 메타데이터를 반환해야 함', async () => {
      const mockClient = mockDeep<Anthropic>();
      const bridge = new AnthropicBridge(mockClient, {
        ...config,
        model: AnthropicModelEnum.CLAUDE_SONNET_4,
      });

      const metadata = await bridge.getMetadata();

      expect(metadata).toEqual({
        name: 'Anthropic Claude Sonnet',
        version: '4',
        description: 'Anthropic Claude Sonnet Bridge Implementation',
        model: 'claude-sonnet-4',
        contextWindow: 200000,
        maxTokens: 128000,
      });
    });

    it('Claude Opus 4.1 모델의 메타데이터를 반환해야 함', async () => {
      const mockClient = mockDeep<Anthropic>();
      const bridge = new AnthropicBridge(mockClient, {
        ...config,
        model: AnthropicModelEnum.CLAUDE_OPUS_4_1,
      });

      const metadata = await bridge.getMetadata();

      expect(metadata).toEqual({
        name: 'Anthropic Claude Opus',
        version: '4.1',
        description: 'Anthropic Claude Opus Bridge Implementation',
        model: 'claude-opus-4.1',
        contextWindow: 200000,
        maxTokens: 128000,
      });
    });
  });

  describe('createAnthropicBridge factory', () => {
    it('올바른 설정으로 브릿지를 생성해야 함', () => {
      const bridge = createAnthropicBridge({
        apiKey: 'test-key',
        model: AnthropicModelEnum.CLAUDE_SONNET_4,
      });

      expect(bridge).toBeInstanceOf(AnthropicBridge);
    });

    it('기본 설정으로 브릿지를 생성해야 함', () => {
      const bridge = createAnthropicBridge({
        apiKey: 'test-key',
      });

      expect(bridge).toBeInstanceOf(AnthropicBridge);
    });
  });

  describe('Config 검증', () => {
    it('유효한 설정을 통과시켜야 함', () => {
      const validConfig = {
        apiKey: 'test-key',
        model: AnthropicModelEnum.CLAUDE_SONNET_4,
        temperature: 0.7,
        maxTokens: 8192,
        topP: 0.9,
        useLongContext: true,
      };

      const result = AnthropicConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('필수 필드가 누락된 경우 검증에 실패해야 함', () => {
      const invalidConfig = {
        model: AnthropicModelEnum.CLAUDE_SONNET_4,
        // apiKey 누락
      };

      const result = AnthropicConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('잘못된 temperature 범위를 거부해야 함', () => {
      const invalidConfig = {
        apiKey: 'test-key',
        temperature: 2.0, // 1.0을 초과
      };

      const result = AnthropicConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('잘못된 모델 이름을 거부해야 함', () => {
      const invalidConfig = {
        apiKey: 'test-key',
        model: 'invalid-model',
      };

      const result = AnthropicConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });
});
