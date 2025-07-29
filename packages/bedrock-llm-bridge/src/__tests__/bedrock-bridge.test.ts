import {
  BedrockRuntimeClient,
  BedrockRuntimeServiceException,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { Agent } from 'http';
import {
  AuthenticationError,
  ConfigurationError,
  InvalidRequestError,
  LlmBridgeError,
  LlmBridgePrompt,
  ModelNotSupportedError,
  NetworkError,
  RateLimitError,
  ResponseParsingError,
  ServiceUnavailableError,
  TimeoutError,
} from 'llm-bridge-spec';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import * as Bedrock from '../index';
import { AbstractModel } from '../models/base/abstract-model';

// Helper function to create mock response body with transformToString method
function createMockResponseBody(content: string | object): Uint8Array {
  const jsonString = typeof content === 'string' ? content : JSON.stringify(content);
  const bodyArray = new TextEncoder().encode(jsonString);

  Object.defineProperty(bodyArray, 'transformToString', {
    value: (encoding?: string) => {
      return new TextDecoder(encoding || 'utf-8').decode(bodyArray);
    },
  });

  return bodyArray;
}

// Helper function to create mock ModelBridge
function createMockModelBridge(modelId: string) {
  const mockBridge = mock<AbstractModel>();

  mockBridge.buildRequestBody.mockReturnValue({
    messages: [{ role: 'user', content: 'test' }],
    temperature: 0.7,
  });

  mockBridge.parseResponse.mockReturnValue({
    content: { contentType: 'text', value: 'Mock response' },
    usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
  });

  mockBridge.getMetadata.mockResolvedValue({
    name: 'Mock Model',
    version: '1.0',
    description: 'Mock model bridge',
    model: modelId,
    contextWindow: 4096,
    maxTokens: 1000,
  });

  mockBridge.supportsModel.mockReturnValue(true);
  mockBridge.getModelId.mockReturnValue(modelId);

  return mockBridge;
}

describe('BedrockBridge (통합)', () => {
  let mockClient: ReturnType<typeof mock<BedrockRuntimeClient>>;

  beforeEach(() => {
    mockClient = mock<BedrockRuntimeClient>();
  });

  describe('createBedrockBridge', () => {
    // Store original env vars to restore after tests
    const originalEnv = process.env.AWS_PROFILE;

    afterEach(() => {
      // Restore original environment
      if (originalEnv) {
        process.env.AWS_PROFILE = originalEnv;
      } else {
        delete process.env.AWS_PROFILE;
      }
    });

    describe('Anthropic Claude 모델 지원', () => {
      it('should create bridge for Claude 3.5 Sonnet', () => {
        const bridge = Bedrock.default.create({
          modelId: Bedrock.BedrockModels.CLAUDE_3_5_SONNET,
          region: 'us-east-1',
        });
        expect(bridge).toBeDefined();
      });

      it('should create bridge for Claude 3 Haiku', () => {
        const bridge = Bedrock.default.create({
          modelId: Bedrock.BedrockModels.CLAUDE_3_HAIKU,
          region: 'us-east-1',
        });
        expect(bridge).toBeDefined();
      });

      it('should handle Claude invoke request', async () => {
        const modelId = Bedrock.BedrockModels.CLAUDE_3_SONNET;
        const mockModelBridge = createMockModelBridge(modelId);
        const config = { modelId };

        const bridge = new Bedrock.default(mockClient, mockModelBridge, config);

        const mockResponse = {
          body: createMockResponseBody({
            content: 'Hello from Claude!',
            usage: { input_tokens: 10, output_tokens: 15 },
          }),
        };

        mockClient.send.mockResolvedValue(mockResponse);

        const prompt: LlmBridgePrompt = {
          messages: [
            {
              role: 'user',
              content: [{ contentType: 'text', value: 'Hello!' }],
            },
          ],
        };

        const result = await bridge.invoke(prompt);
        expect(result.content.value).toBe('Mock response'); // mock의 리턴값으로 변경
        expect(result.usage?.promptTokens).toBe(10);
      });
    });

    describe('Meta Llama 모델 지원', () => {
      it('should create bridge for Llama 3 70B', () => {
        const bridge = Bedrock.default.create({
          modelId: Bedrock.BedrockModels.LLAMA_3_70B,
          region: 'us-east-1',
        });
        expect(bridge).toBeDefined();
      });

      it('should create bridge for Llama 3.1 8B', () => {
        const bridge = Bedrock.default.create({
          modelId: Bedrock.BedrockModels.LLAMA_3_1_8B,
          region: 'us-east-1',
        });
        expect(bridge).toBeDefined();
      });

      it('should handle Llama invoke request', async () => {
        const modelId = Bedrock.BedrockModels.LLAMA_3_70B;
        const mockModelBridge = createMockModelBridge(modelId);
        const config = { modelId };

        const bridge = new Bedrock.default(mockClient, mockModelBridge, config);

        const mockResponse = {
          body: createMockResponseBody({
            generation: 'Hello from Llama!',
          }),
        };

        mockClient.send.mockResolvedValue(mockResponse);

        const prompt: LlmBridgePrompt = {
          messages: [
            {
              role: 'user',
              content: [{ contentType: 'text', value: 'Hello!' }],
            },
          ],
        };

        const result = await bridge.invoke(prompt);
        expect(result.content.value).toBe('Mock response');
      });
    });

    describe('AWS 설정', () => {
      it('should create bridge with AWS credentials', () => {
        const config = {
          modelId: Bedrock.BedrockModels.CLAUDE_3_HAIKU,
          region: 'us-west-2',
          accessKeyId: 'test-access-key-id',
          secretAccessKey: 'test-secret-access-key',
          sessionToken: 'test-session-token',
        };

        const bridge = Bedrock.default.create(config);
        expect(bridge).toBeDefined();
      });

      it('should create bridge with AWS profile', () => {
        const config = {
          modelId: Bedrock.BedrockModels.LLAMA_3_8B,
          region: 'us-east-1',
          profile: 'test-profile',
        };

        const bridge = Bedrock.default.create(config);
        expect(bridge).toBeDefined();
        expect(process.env.AWS_PROFILE).toBe('test-profile');
      });

      it('should create bridge with custom endpoint', () => {
        const config = {
          modelId: Bedrock.BedrockModels.CLAUDE_3_SONNET,
          region: 'us-east-1',
          endpoint: 'http://localhost:4566', // LocalStack
        };

        const bridge = Bedrock.default.create(config);
        expect(bridge).toBeDefined();
      });

      it('should create bridge with http agent', () => {
        const agent = new Agent({ keepAlive: true });
        const config = {
          modelId: Bedrock.BedrockModels.LLAMA_3_70B,
          region: 'us-east-1',
          httpAgent: agent,
        };

        const bridge = Bedrock.default.create(config);
        expect(bridge).toBeDefined();
      });
    });

    describe('런타임 검증', () => {
      it('should reject unsupported model', () => {
        const invalidConfig = {
          modelId: 'unsupported.model-v1:0',
        };

        expect(() => Bedrock.default.create(invalidConfig)).toThrow();
      });

      it('should reject invalid temperature', () => {
        const invalidConfig = {
          modelId: Bedrock.BedrockModels.CLAUDE_3_HAIKU,
          temperature: 2.0, // 범위 초과
        };

        expect(() => Bedrock.default.create(invalidConfig)).toThrow();
      });

      it('should reject invalid topP', () => {
        const invalidConfig = {
          modelId: Bedrock.BedrockModels.LLAMA_3_8B,
          topP: -0.1, // 음수
        };

        expect(() => Bedrock.default.create(invalidConfig)).toThrow();
      });

      it('should reject invalid maxTokens', () => {
        const invalidConfig = {
          modelId: Bedrock.BedrockModels.CLAUDE_3_SONNET,
          maxTokens: 0, // 최소값 미만
        };

        expect(() => Bedrock.default.create(invalidConfig)).toThrow();
      });
    });

    describe('모델별 특화 기능', () => {
      it('should use Claude-specific parameters', async () => {
        const modelId = Bedrock.BedrockModels.CLAUDE_3_SONNET;
        const mockModelBridge = createMockModelBridge(modelId);
        const config = { modelId };

        const bridge = new Bedrock.default(mockClient, mockModelBridge, config);

        const mockResponse = {
          body: createMockResponseBody({
            content: 'Claude response',
          }),
        };

        mockClient.send.mockResolvedValue(mockResponse);

        const prompt: LlmBridgePrompt = {
          messages: [
            {
              role: 'user',
              content: [{ contentType: 'text', value: 'Test' }],
            },
          ],
        };

        await bridge.invoke(prompt);

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockClient.send).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
      });

      it('should use Llama-specific parameters', async () => {
        const modelId = Bedrock.BedrockModels.LLAMA_3_70B;
        const mockModelBridge = createMockModelBridge(modelId);
        const config = { modelId };

        const bridge = new Bedrock.default(mockClient, mockModelBridge, config);

        const mockResponse = {
          body: createMockResponseBody({
            generation: 'Llama response',
          }),
        };

        mockClient.send.mockResolvedValue(mockResponse);

        const prompt: LlmBridgePrompt = {
          messages: [
            {
              role: 'user',
              content: [{ contentType: 'text', value: 'Test' }],
            },
          ],
        };

        await bridge.invoke(prompt);

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockClient.send).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
      });
    });

    describe('metadata', () => {
      it('should return Claude metadata', async () => {
        const modelId = Bedrock.BedrockModels.CLAUDE_3_HAIKU;
        const mockModelBridge = createMockModelBridge(modelId);
        const config = { modelId };

        const bridge = new Bedrock.default(mockClient, mockModelBridge, config);

        const metadata = await bridge.getMetadata();
        expect(metadata.model).toBe(Bedrock.BedrockModels.CLAUDE_3_HAIKU);
      });

      it('should return Llama metadata', async () => {
        const modelId = Bedrock.BedrockModels.LLAMA_3_8B;
        const mockModelBridge = createMockModelBridge(modelId);
        const config = { modelId };

        const bridge = new Bedrock.default(mockClient, mockModelBridge, config);

        const metadata = await bridge.getMetadata();
        expect(metadata.model).toBe(Bedrock.BedrockModels.LLAMA_3_8B);
      });
    });

    describe('기본값 처리', () => {
      it('should apply default model when none provided', () => {
        const bridge = Bedrock.default.create({
          modelId: Bedrock.BedrockModels.CLAUDE_3_HAIKU,
        });
        expect(bridge).toBeDefined();
      });

      it('should apply default region', () => {
        const bridge = Bedrock.default.create({
          modelId: Bedrock.BedrockModels.CLAUDE_3_HAIKU,
        });
        expect(bridge).toBeDefined();
      });
    });
  });

  describe('에러 처리', () => {
    let bridge: ReturnType<typeof Bedrock.default.create>;

    beforeEach(() => {
      const modelId = Bedrock.BedrockModels.CLAUDE_3_HAIKU;
      const mockModelBridge = createMockModelBridge(modelId);
      const config = { modelId };

      bridge = new Bedrock.default(mockClient, mockModelBridge, config);
    });

    describe('Configuration 에러', () => {
      it('should throw ConfigurationError for invalid Zod validation', () => {
        expect(() =>
          Bedrock.default.create({
            modelId: Bedrock.BedrockModels.CLAUDE_3_HAIKU,
            temperature: 2.0, // 범위 초과
          })
        ).toThrow(ConfigurationError);
      });

      it('should throw ModelNotSupportedError for unsupported model', () => {
        expect(() =>
          Bedrock.default.create({
            modelId: 'unsupported.model-v1:0',
          })
        ).toThrow(ModelNotSupportedError);
      });
    });

    describe('AWS SDK 에러 변환', () => {
      const samplePrompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: [{ contentType: 'text', value: 'test' }],
          },
        ],
      };

      it('should convert ThrottlingException to RateLimitError', async () => {
        const throttlingError = new BedrockRuntimeServiceException({
          name: 'ThrottlingException',
          $metadata: { totalRetryDelay: 30 },
          $fault: 'client',
        });

        mockClient.send.mockRejectedValue(throttlingError);

        await expect(bridge.invoke(samplePrompt)).rejects.toThrow(RateLimitError);

        try {
          await bridge.invoke(samplePrompt);
        } catch (error) {
          expect(error).toBeInstanceOf(RateLimitError);
          expect((error as RateLimitError).retryAfter).toBe(30);
        }
      });

      it('should convert UnauthorizedException to AuthenticationError', async () => {
        const authError = new BedrockRuntimeServiceException({
          name: 'UnauthorizedException',
          $metadata: { totalRetryDelay: 60 },
          $fault: 'client',
        });

        mockClient.send.mockRejectedValue(authError);

        await expect(bridge.invoke(samplePrompt)).rejects.toThrow(AuthenticationError);
      });

      it('should convert ServiceUnavailableException to ServiceUnavailableError', async () => {
        const serviceError = new BedrockRuntimeServiceException({
          name: 'ServiceUnavailableException',
          $metadata: { totalRetryDelay: 60 },
          $fault: 'server',
        });

        mockClient.send.mockRejectedValue(serviceError);

        await expect(bridge.invoke(samplePrompt)).rejects.toThrow(ServiceUnavailableError);

        try {
          await bridge.invoke(samplePrompt);
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceUnavailableError);
          expect((error as ServiceUnavailableError).retryAfter).toBe(60);
        }
      });

      it('should convert ValidationException to InvalidRequestError', async () => {
        const validationError = new BedrockRuntimeServiceException({
          name: 'ValidationException',
          $metadata: { totalRetryDelay: 60 },
          $fault: 'client',
        });

        mockClient.send.mockRejectedValue(validationError);

        await expect(bridge.invoke(samplePrompt)).rejects.toThrow(InvalidRequestError);
      });

      it('should convert ModelNotFoundError to ModelNotSupportedError', async () => {
        const modelError = new BedrockRuntimeServiceException({
          name: 'ModelNotFoundError',
          $metadata: { totalRetryDelay: 60 },
          $fault: 'client',
        });

        mockClient.send.mockRejectedValue(modelError);

        await expect(bridge.invoke(samplePrompt)).rejects.toThrow(ModelNotSupportedError);
      });

      it('should convert TimeoutError to TimeoutError', async () => {
        const timeoutError = new BedrockRuntimeServiceException({
          name: 'TimeoutError',
          $metadata: { totalRetryDelay: 5000 },
          $fault: 'client',
        });

        mockClient.send.mockRejectedValue(timeoutError);

        await expect(bridge.invoke(samplePrompt)).rejects.toThrow(TimeoutError);

        try {
          await bridge.invoke(samplePrompt);
        } catch (error) {
          expect(error).toBeInstanceOf(TimeoutError);
        }
      });

      it('should convert network errors to NetworkError', async () => {
        const networkError = new NetworkError('Connection refused');

        mockClient.send.mockRejectedValue(networkError);

        await expect(bridge.invoke(samplePrompt)).rejects.toThrow(NetworkError);
      });

      it('should convert unknown errors to LlmBridgeError', async () => {
        const unknownError = new Error('Unknown error');
        unknownError.name = 'UnknownError';

        mockClient.send.mockRejectedValue(unknownError);

        await expect(bridge.invoke(samplePrompt)).rejects.toThrow(LlmBridgeError);
      });
    });

    describe('Response 파싱 에러', () => {
      const samplePrompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: [{ contentType: 'text', value: 'test' }],
          },
        ],
      };

      it('should throw ResponseParsingError for invalid JSON response', async () => {
        const mockResponse = {
          body: createMockResponseBody('invalid json'),
        };

        mockClient.send.mockResolvedValue(mockResponse);

        await expect(bridge.invoke(samplePrompt)).rejects.toThrow(ResponseParsingError);

        try {
          await bridge.invoke(samplePrompt);
        } catch (error) {
          expect(error).toBeInstanceOf(ResponseParsingError);
          expect((error as ResponseParsingError).rawResponse).toEqual({
            responseText: 'invalid json',
          });
        }
      });

      it('should preserve original error in ResponseParsingError', async () => {
        const mockResponse = {
          body: createMockResponseBody('{"incomplete": json'),
        };

        mockClient.send.mockResolvedValue(mockResponse);

        try {
          await bridge.invoke(samplePrompt);
        } catch (error) {
          expect(error).toBeInstanceOf(ResponseParsingError);
          expect((error as ResponseParsingError).cause).toBeDefined();
          expect((error as ResponseParsingError).cause?.name).toBe('SyntaxError');
        }
      });
    });

    describe('Stream 에러 처리', () => {
      const samplePrompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: [{ contentType: 'text', value: 'test stream' }],
          },
        ],
      };

      it('should handle stream initialization errors', async () => {
        const streamError = new BedrockRuntimeServiceException({
          name: 'ThrottlingException',
          $metadata: { totalRetryDelay: 30 },
          $fault: 'client',
        });

        mockClient.send.mockRejectedValue(streamError);

        const streamIterator = bridge.invokeStream(samplePrompt);
        await expect(streamIterator.next()).rejects.toThrow(RateLimitError);
      });

      it('should handle stream chunk parsing errors', async () => {
        const mockStreamResponse = {
          body: (async function* () {
            yield {
              chunk: {
                bytes: createMockResponseBody('invalid json chunk'),
              },
            };
          })(),
        };

        mockClient.send.mockResolvedValue(mockStreamResponse);

        const streamIterator = bridge.invokeStream(samplePrompt);
        await expect(streamIterator.next()).rejects.toThrow(ResponseParsingError);
      });
    });

    describe('에러 전파', () => {
      it('should preserve original error chain', async () => {
        const originalError = new BedrockRuntimeServiceException({
          name: 'ThrottlingException',
          $metadata: { totalRetryDelay: 60 },
          $fault: 'client',
        });

        mockClient.send.mockRejectedValue(originalError);

        const samplePrompt: LlmBridgePrompt = {
          messages: [
            {
              role: 'user',
              content: [{ contentType: 'text', value: 'test' }],
            },
          ],
        };

        try {
          await bridge.invoke(samplePrompt);
        } catch (error) {
          expect(error).toBeInstanceOf(RateLimitError);
          expect((error as RateLimitError).cause).toBe(originalError);
          expect((error as RateLimitError).message).toContain('Bedrock API rate limit exceeded');
        }
      });
    });
  });
});
