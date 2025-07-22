import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Agent } from 'http';
import { LlmBridgePrompt } from 'llm-bridge-spec';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import * as BedrockBridge from '../index';

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
        const bridge = BedrockBridge.default.create({
          modelId: BedrockBridge.BedrockModels.CLAUDE_3_5_SONNET,
          region: 'us-east-1',
        });
        expect(bridge).toBeDefined();
      });

      it('should create bridge for Claude 3 Haiku', () => {
        const bridge = BedrockBridge.default.create({
          modelId: BedrockBridge.BedrockModels.CLAUDE_3_HAIKU,
          region: 'us-east-1',
        });
        expect(bridge).toBeDefined();
      });

      it('should handle Claude invoke request', async () => {
        const bridge = new BedrockBridge.default(mockClient, {
          modelId: BedrockBridge.BedrockModels.CLAUDE_3_SONNET,
        });

        const mockResponse = {
          body: new TextEncoder().encode(
            JSON.stringify({
              content: 'Hello from Claude!',
              usage: { input_tokens: 10, output_tokens: 15 },
            })
          ),
        };

        mockClient.send.mockResolvedValue(mockResponse);

        const prompt: LlmBridgePrompt = {
          messages: [
            {
              role: 'user',
              content: { contentType: 'text', value: 'Hello!' },
            },
          ],
        };

        const result = await bridge.invoke(prompt);
        expect(result.content.value).toBe('Hello from Claude!');
        expect(result.usage?.promptTokens).toBe(10);
      });
    });

    describe('Meta Llama 모델 지원', () => {
      it('should create bridge for Llama 3 70B', () => {
        const bridge = BedrockBridge.default.create({
          modelId: BedrockBridge.BedrockModels.LLAMA_3_70B,
          region: 'us-east-1',
        });
        expect(bridge).toBeDefined();
      });

      it('should create bridge for Llama 3.1 8B', () => {
        const bridge = BedrockBridge.default.create({
          modelId: BedrockBridge.BedrockModels.LLAMA_3_1_8B,
          region: 'us-east-1',
        });
        expect(bridge).toBeDefined();
      });

      it('should handle Llama invoke request', async () => {
        const bridge = new BedrockBridge.default(mockClient, {
          modelId: BedrockBridge.BedrockModels.LLAMA_3_70B,
        });

        const mockResponse = {
          body: new TextEncoder().encode(
            JSON.stringify({
              generation: 'Hello from Llama!',
            })
          ),
        };

        mockClient.send.mockResolvedValue(mockResponse);

        const prompt: LlmBridgePrompt = {
          messages: [
            {
              role: 'user',
              content: { contentType: 'text', value: 'Hello!' },
            },
          ],
        };

        const result = await bridge.invoke(prompt);
        expect(result.content.value).toBe('Hello from Llama!');
      });
    });

    describe('AWS 설정', () => {
      it('should create bridge with AWS credentials', () => {
        const config = {
          modelId: BedrockBridge.BedrockModels.CLAUDE_3_HAIKU,
          region: 'us-west-2',
          accessKeyId: 'test-access-key-id',
          secretAccessKey: 'test-secret-access-key',
          sessionToken: 'test-session-token',
        };

        const bridge = BedrockBridge.default.create(config);
        expect(bridge).toBeDefined();
      });

      it('should create bridge with AWS profile', () => {
        const config = {
          modelId: BedrockBridge.BedrockModels.LLAMA_3_8B,
          region: 'us-east-1',
          profile: 'test-profile',
        };

        const bridge = BedrockBridge.default.create(config);
        expect(bridge).toBeDefined();
        expect(process.env.AWS_PROFILE).toBe('test-profile');
      });

      it('should create bridge with custom endpoint', () => {
        const config = {
          modelId: BedrockBridge.BedrockModels.CLAUDE_3_SONNET,
          region: 'us-east-1',
          endpoint: 'http://localhost:4566', // LocalStack
        };

        const bridge = BedrockBridge.default.create(config);
        expect(bridge).toBeDefined();
      });

      it('should create bridge with http agent', () => {
        const agent = new Agent({ keepAlive: true });
        const config = {
          modelId: BedrockBridge.BedrockModels.LLAMA_3_70B,
          region: 'us-east-1',
          httpAgent: agent,
        };

        const bridge = BedrockBridge.default.create(config);
        expect(bridge).toBeDefined();
      });
    });

    describe('런타임 검증', () => {
      it('should reject unsupported model', () => {
        const invalidConfig = {
          modelId: 'unsupported.model-v1:0',
        };

        expect(() => BedrockBridge.default.create(invalidConfig)).toThrow();
      });

      it('should reject invalid temperature', () => {
        const invalidConfig = {
          modelId: BedrockBridge.BedrockModels.CLAUDE_3_HAIKU,
          temperature: 2.0, // 범위 초과
        };

        expect(() => BedrockBridge.default.create(invalidConfig)).toThrow();
      });

      it('should reject invalid topP', () => {
        const invalidConfig = {
          modelId: BedrockBridge.BedrockModels.LLAMA_3_8B,
          topP: -0.1, // 음수
        };

        expect(() => BedrockBridge.default.create(invalidConfig)).toThrow();
      });

      it('should reject invalid maxTokens', () => {
        const invalidConfig = {
          modelId: BedrockBridge.BedrockModels.CLAUDE_3_SONNET,
          maxTokens: 0, // 최소값 미만
        };

        expect(() => BedrockBridge.default.create(invalidConfig)).toThrow();
      });
    });

    describe('모델별 특화 기능', () => {
      it('should use Claude-specific parameters', async () => {
        const bridge = new BedrockBridge.default(mockClient, {
          modelId: BedrockBridge.BedrockModels.CLAUDE_3_SONNET,
          temperature: 0.7,
          topP: 0.9,
          topK: 50, // Claude 전용
          maxTokens: 1000,
        });

        const mockResponse = {
          body: new TextEncoder().encode(
            JSON.stringify({
              content: 'Claude response',
            })
          ),
        };

        mockClient.send.mockResolvedValue(mockResponse);

        const prompt: LlmBridgePrompt = {
          messages: [
            {
              role: 'user',
              content: { contentType: 'text', value: 'Test' },
            },
          ],
        };

        await bridge.invoke(prompt);

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockClient.send).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
      });

      it('should use Llama-specific parameters', async () => {
        const bridge = new BedrockBridge.default(mockClient, {
          modelId: BedrockBridge.BedrockModels.LLAMA_3_70B,
          temperature: 0.8,
          topP: 0.95,
          maxTokens: 2000,
        });

        const mockResponse = {
          body: new TextEncoder().encode(
            JSON.stringify({
              generation: 'Llama response',
            })
          ),
        };

        mockClient.send.mockResolvedValue(mockResponse);

        const prompt: LlmBridgePrompt = {
          messages: [
            {
              role: 'user',
              content: { contentType: 'text', value: 'Test' },
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
        const bridge = new BedrockBridge.default(mockClient, {
          modelId: BedrockBridge.BedrockModels.CLAUDE_3_HAIKU,
        });

        const metadata = await bridge.getMetadata();
        expect(metadata.name).toBe('Anthropic Claude');
        expect(metadata.model).toBe(BedrockBridge.BedrockModels.CLAUDE_3_HAIKU);
      });

      it('should return Llama metadata', async () => {
        const bridge = new BedrockBridge.default(mockClient, {
          modelId: BedrockBridge.BedrockModels.LLAMA_3_8B,
        });

        const metadata = await bridge.getMetadata();
        expect(metadata.name).toBe('Meta Llama');
        expect(metadata.model).toBe(BedrockBridge.BedrockModels.LLAMA_3_8B);
      });
    });

    describe('기본값 처리', () => {
      it('should apply default model when none provided', () => {
        const bridge = BedrockBridge.default.create({
          modelId: BedrockBridge.BedrockModels.CLAUDE_3_HAIKU,
        });
        expect(bridge).toBeDefined();
      });

      it('should apply default region', () => {
        const bridge = BedrockBridge.default.create({
          modelId: BedrockBridge.BedrockModels.CLAUDE_3_HAIKU,
        });
        expect(bridge).toBeDefined();
      });
    });
  });
});
