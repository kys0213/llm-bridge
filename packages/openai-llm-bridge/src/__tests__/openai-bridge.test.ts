import { LlmBridgePrompt, LlmBridgeTool } from 'llm-bridge-spec';
import OpenAI from 'openai';
import { describe, expect, it } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { OpenAIBridge } from '../bridge/openai-bridge';
import { OpenAIConfig, OpenAIConfigSchema } from '../bridge/openai-config';
import { createOpenAIBridge } from '../bridge/openai-factory';
import { OpenAIModelEnum } from '../bridge/openai-models';

describe('OpenAIBridge', () => {
  const config: OpenAIConfig = {
    apiKey: 'test-api-key',
    model: OpenAIModelEnum.GPT_4O,
    temperature: 0.7,
    maxTokens: 2000,
  };

  describe('constructor', () => {
    it('올바른 설정으로 브릿지를 생성해야 함', () => {
      const mockClient = mockDeep<OpenAI>();
      const bridge = new OpenAIBridge(mockClient, config);

      expect(bridge).toBeInstanceOf(OpenAIBridge);
    });

    it('기본 모델을 사용해야 함 (model이 설정되지 않은 경우)', () => {
      const mockClient = mockDeep<OpenAI>();
      const configWithoutModel = { ...config };
      delete configWithoutModel.model;

      const bridge = new OpenAIBridge(mockClient, configWithoutModel);

      expect(bridge).toBeInstanceOf(OpenAIBridge);
    });
  });

  describe('invoke', () => {
    it('기본적인 텍스트 프롬프트로 응답을 생성해야 함', async () => {
      const mockClient = mockDeep<OpenAI>();
      const bridge = new OpenAIBridge(mockClient, config);
      const prompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: [{ contentType: 'text', value: 'Hello, world!' }],
          },
        ],
      };

      const mockResponse = {
        id: 'chatcmpl-test',
        object: 'chat.completion' as const,
        created: 1716393600,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant' as const,
              content: 'Hello! How can I help you today?',
            },
            finish_reason: 'stop' as const,
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18,
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const response = await bridge.invoke(prompt);

      expect(response.content).toEqual({
        contentType: 'text',
        value: 'Hello! How can I help you today?',
      });
      expect(response.usage).toEqual({
        promptTokens: 10,
        completionTokens: 8,
        totalTokens: 18,
      });
    });

    it('도구 호출을 지원해야 함', async () => {
      const mockClient = mockDeep<OpenAI>();
      const bridge = new OpenAIBridge(mockClient, config);
      const prompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: [{ contentType: 'text', value: 'What is the weather like?' }],
          },
        ],
      };

      const mockResponse = {
        id: 'chatcmpl-test',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant' as const,
              content: null,
              tool_calls: [
                {
                  id: 'call_test',
                  type: 'function' as const,
                  function: {
                    name: 'get_weather',
                    arguments: '{"location": "New York"}',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls' as const,
          },
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 10,
          total_tokens: 25,
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

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
        toolCallId: 'call_test',
        name: 'get_weather',
        arguments: { location: 'New York' },
      });
    });

    it('옵션으로 전달된 파라미터를 우선 사용해야 함', async () => {
      const mockClient = mockDeep<OpenAI>();
      const bridge = new OpenAIBridge(mockClient, config);
      const prompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: [{ contentType: 'text', value: 'Test' }],
          },
        ],
      };

      const mockResponse = {
        id: 'chatcmpl-test',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant' as const,
              content: 'Response',
            },
            finish_reason: 'stop' as const,
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 3,
          total_tokens: 8,
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      await bridge.invoke(prompt, {
        temperature: 0.9,
        maxTokens: 1000,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9,
          max_tokens: 1000,
        })
      );
    });
  });

  describe('getMetadata', () => {
    it('GPT-4o 모델의 메타데이터를 반환해야 함', async () => {
      const mockClient = mockDeep<OpenAI>();
      const bridge = new OpenAIBridge(mockClient, {
        ...config,
        model: OpenAIModelEnum.GPT_4O,
      });

      const metadata = await bridge.getMetadata();

      expect(metadata).toEqual({
        name: 'OpenAI GPT-4o',
        version: '4',
        description: 'OpenAI GPT-4o Bridge Implementation',
        model: 'gpt-4o',
        contextWindow: 128000,
        maxTokens: 16384,
      });
    });

    it('GPT-3.5 Turbo 모델의 메타데이터를 반환해야 함', async () => {
      const mockClient = mockDeep<OpenAI>();
      const bridge = new OpenAIBridge(mockClient, {
        ...config,
        model: OpenAIModelEnum.GPT_35_TURBO,
      });

      const metadata = await bridge.getMetadata();

      expect(metadata).toEqual({
        name: 'OpenAI GPT-3.5 Turbo',
        version: '3.5',
        description: 'OpenAI GPT-3.5 Turbo Bridge Implementation',
        model: 'gpt-3.5-turbo',
        contextWindow: 16385,
        maxTokens: 4096,
      });
    });

    it('O1 Preview 모델의 메타데이터를 반환해야 함', async () => {
      const mockClient = mockDeep<OpenAI>();
      const bridge = new OpenAIBridge(mockClient, {
        ...config,
        model: OpenAIModelEnum.O1_PREVIEW,
      });

      const metadata = await bridge.getMetadata();

      expect(metadata).toEqual({
        name: 'OpenAI o1 Preview',
        version: '1',
        description: 'OpenAI o1 Preview Bridge Implementation',
        model: 'o1-preview',
        contextWindow: 128000,
        maxTokens: 32768,
      });
    });
  });

  describe('createOpenAIBridge factory', () => {
    it('올바른 설정으로 브릿지를 생성해야 함', () => {
      const bridge = createOpenAIBridge({
        apiKey: 'test-key',
        model: OpenAIModelEnum.GPT_4O,
      });

      expect(bridge).toBeInstanceOf(OpenAIBridge);
    });

    it('기본 설정으로 브릿지를 생성해야 함', () => {
      const bridge = createOpenAIBridge({
        apiKey: 'test-key',
      });

      expect(bridge).toBeInstanceOf(OpenAIBridge);
    });
  });

  describe('Config 검증', () => {
    it('유효한 설정을 통과시켜야 함', () => {
      const validConfig = {
        apiKey: 'sk-test-key',
        model: OpenAIModelEnum.GPT_4O,
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
      };

      const result = OpenAIConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('필수 필드가 누락된 경우 검증에 실패해야 함', () => {
      const invalidConfig = {
        model: OpenAIModelEnum.GPT_4O,
        // apiKey 누락
      };

      const result = OpenAIConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('잘못된 temperature 범위를 거부해야 함', () => {
      const invalidConfig = {
        apiKey: 'sk-test-key',
        temperature: 3.0, // 2.0을 초과
      };

      const result = OpenAIConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('잘못된 모델 이름을 거부해야 함', () => {
      const invalidConfig = {
        apiKey: 'sk-test-key',
        model: 'invalid-model',
      };

      const result = OpenAIConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('에러 처리', () => {
    it('OpenAI API 에러를 올바르게 처리해야 함', async () => {
      const mockClient = mockDeep<OpenAI>();
      const bridge = new OpenAIBridge(mockClient, config);
      const prompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: [{ contentType: 'text', value: 'Test' }],
          },
        ],
      };

      const apiError = new Error('API rate limit exceeded');
      mockClient.chat.completions.create.mockRejectedValue(apiError);

      await expect(bridge.invoke(prompt)).rejects.toThrow('API rate limit exceeded');
    });

    it('네트워크 에러를 올바르게 처리해야 함', async () => {
      const mockClient = mockDeep<OpenAI>();
      const bridge = new OpenAIBridge(mockClient, config);
      const prompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: [{ contentType: 'text', value: 'Test' }],
          },
        ],
      };

      const networkError = new Error('Network connection failed');
      mockClient.chat.completions.create.mockRejectedValue(networkError);

      await expect(bridge.invoke(prompt)).rejects.toThrow('Network connection failed');
    });
  });
});
