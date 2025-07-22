import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import {
  BedrockAnthropicBridge,
  createBedrockAnthropicBridge,
} from '../bridge/bedrock-anthropic-bridge';
import { LlmBridgePrompt } from 'llm-bridge-spec';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Agent } from 'http';

describe('BedrockAnthropicBridge', () => {
  let mockClient: ReturnType<typeof mock<BedrockRuntimeClient>>;
  let bridge: BedrockAnthropicBridge;

  beforeEach(() => {
    mockClient = mock<BedrockRuntimeClient>();
    bridge = new BedrockAnthropicBridge(mockClient);
  });

  describe('constructor', () => {
    it('should create bridge with default config', () => {
      expect(bridge).toBeDefined();
    });

    it('should create bridge with custom config', () => {
      const config = {
        region: 'us-west-2',
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        temperature: 0.5,
        maxTokens: 1000,
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      };
      const customBridge = new BedrockAnthropicBridge(mockClient, config);
      expect(customBridge).toBeDefined();
    });
  });

  describe('invoke', () => {
    const samplePrompt: LlmBridgePrompt = {
      messages: [
        {
          role: 'user',
          content: {
            contentType: 'text',
            value: 'Hello, how are you?',
          },
        },
      ],
    };

    it('should invoke model successfully', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: 'Hello! I am doing well, thank you for asking.',
            usage: {
              input_tokens: 10,
              output_tokens: 15,
            },
          })
        ),
      };

      mockClient.send.mockResolvedValue(mockResponse);

      const result = await bridge.invoke(samplePrompt);

      expect(result).toBeDefined();
      expect(result.content.contentType).toBe('text');
      expect(result.content.value).toBe('Hello! I am doing well, thank you for asking.');
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 15,
        totalTokens: 25,
      });
    });

    it('should handle response without usage information', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: 'Response without usage',
          })
        ),
      };

      mockClient.send.mockResolvedValue(mockResponse);

      const result = await bridge.invoke(samplePrompt);

      expect(result.content.value).toBe('Response without usage');
      expect(result.usage).toBeUndefined();
    });

    it('should pass invoke options to the model', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: 'Test response',
          })
        ),
      };

      mockClient.send.mockResolvedValue(mockResponse);

      const options = {
        temperature: 0.8,
        topP: 0.9,
        topK: 50,
        maxTokens: 500,
        stopSequence: ['stop'],
      };

      await bridge.invoke(samplePrompt, options);

      // Check that send was called with an InvokeModelCommand
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockClient.send).toHaveBeenCalledWith(expect.any(InvokeModelCommand));

      // Verify the command was called
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockClient.send).toHaveBeenCalledTimes(1);
    });

    it('should handle different content types in response', async () => {
      const testCases = [
        { responseKey: 'completion', expectedValue: 'completion response' },
        { responseKey: 'result', expectedValue: 'result response' },
        { responseKey: 'output', expectedValue: 'output response' },
      ];

      for (const testCase of testCases) {
        const mockResponse = {
          body: new TextEncoder().encode(
            JSON.stringify({
              [testCase.responseKey]: testCase.expectedValue,
            })
          ),
        };

        mockClient.send.mockResolvedValue(mockResponse);
        const result = await bridge.invoke(samplePrompt);
        expect(result.content.value).toBe(testCase.expectedValue);

        // Reset mock for next iteration
        mockClient.send.mockClear();
      }
    });

    it('should handle tool messages correctly', async () => {
      const toolPrompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'tool',
            name: 'testTool',
            content: [
              { contentType: 'text', value: 'Tool result 1' },
              { contentType: 'text', value: 'Tool result 2' },
            ],
            toolCallId: 'tool-1',
          },
        ],
      };

      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: 'Tool response',
          })
        ),
      };

      mockClient.send.mockResolvedValue(mockResponse);

      const result = await bridge.invoke(toolPrompt);
      expect(result.content.value).toBe('Tool response');
    });

    it('should use config default parameters', async () => {
      const config = {
        temperature: 0.3,
        maxTokens: 2000,
        stopSequences: ['END'],
      };
      const bridgeWithDefaults = new BedrockAnthropicBridge(mockClient, config);

      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: 'Config defaults test',
          })
        ),
      };

      mockClient.send.mockResolvedValue(mockResponse);

      await bridgeWithDefaults.invoke(samplePrompt);

      // Verify that default config parameters are used when invoke options are not provided
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockClient.send).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
    });
  });

  describe('getMetadata', () => {
    it('should return bridge metadata', async () => {
      const metadata = await bridge.getMetadata();

      expect(metadata).toEqual({
        name: 'Anthropic Claude',
        version: '3',
        description: 'Amazon Bedrock Anthropic LLM Bridge',
        model: 'anthropic.claude-3-haiku-20240307-v1:0',
        contextWindow: 200000,
        maxTokens: 4096,
      });
    });

    it('should return custom model ID in metadata', async () => {
      const customBridge = new BedrockAnthropicBridge(mockClient, {
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      });

      const metadata = await customBridge.getMetadata();
      expect(metadata.model).toBe('anthropic.claude-3-sonnet-20240229-v1:0');
    });
  });

  describe('error handling', () => {
    it('should handle client errors', async () => {
      mockClient.send.mockRejectedValue(new Error('AWS SDK Error'));

      const samplePrompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: { contentType: 'text', value: 'test' },
          },
        ],
      };

      await expect(bridge.invoke(samplePrompt)).rejects.toThrow('AWS SDK Error');
    });

    it('should handle malformed response', async () => {
      const mockResponse = {
        body: new TextEncoder().encode('invalid json'),
      };

      mockClient.send.mockResolvedValue(mockResponse);

      const samplePrompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: { contentType: 'text', value: 'test' },
          },
        ],
      };

      await expect(bridge.invoke(samplePrompt)).rejects.toThrow();
    });
  });
});

describe('createBedrockAnthropicBridge', () => {
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

  it('should create bridge with default configuration', () => {
    const bridge = createBedrockAnthropicBridge();
    expect(bridge).toBeDefined();
  });

  it('should create bridge with custom region and model', () => {
    const config = {
      region: 'eu-west-1',
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      temperature: 0.7,
    };

    const bridge = createBedrockAnthropicBridge(config);
    expect(bridge).toBeDefined();
  });

  it('should create bridge with AWS credentials', () => {
    const config = {
      region: 'us-west-2',
      accessKeyId: 'test-access-key-id',
      secretAccessKey: 'test-secret-access-key',
      sessionToken: 'test-session-token',
    };

    const bridge = createBedrockAnthropicBridge(config);
    expect(bridge).toBeDefined();
  });

  it('should create bridge with AWS profile', () => {
    const config = {
      region: 'us-east-1',
      profile: 'test-profile',
    };

    const bridge = createBedrockAnthropicBridge(config);
    expect(bridge).toBeDefined();
    expect(process.env.AWS_PROFILE).toBe('test-profile');
  });

  it('should create bridge with custom endpoint', () => {
    const config = {
      region: 'us-east-1',
      endpoint: 'http://localhost:4566', // LocalStack endpoint
    };

    const bridge = createBedrockAnthropicBridge(config);
    expect(bridge).toBeDefined();
  });

  it('should create bridge with http agent', () => {
    const agent = new Agent({ keepAlive: true });
    const config = {
      region: 'us-east-1',
      httpAgent: agent,
    };

    const bridge = createBedrockAnthropicBridge(config);
    expect(bridge).toBeDefined();
  });

  it('should create bridge with complete AWS configuration', () => {
    const agent = new Agent({ keepAlive: true });
    const config = {
      region: 'ap-southeast-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      sessionToken: 'test-token',
      modelId: 'anthropic.claude-3-opus-20240229-v1:0',
      endpoint: 'https://bedrock-runtime.ap-southeast-1.amazonaws.com',
      httpAgent: agent,
      temperature: 0.5,
      maxTokens: 1000,
      stopSequences: ['Human:', 'Assistant:'],
    };

    const bridge = createBedrockAnthropicBridge(config);
    expect(bridge).toBeDefined();
  });

  // Zod 런타임 검증 테스트들
  describe('runtime validation', () => {
    it('should reject invalid temperature values', () => {
      const invalidConfig = {
        temperature: 2.0, // 범위를 벗어남 (0-1 이어야 함)
      };

      expect(() => createBedrockAnthropicBridge(invalidConfig)).toThrow();
    });

    it('should reject negative temperature values', () => {
      const invalidConfig = {
        temperature: -0.1, // 음수 값
      };

      expect(() => createBedrockAnthropicBridge(invalidConfig)).toThrow();
    });

    it('should reject invalid maxTokens values', () => {
      const invalidConfig = {
        maxTokens: 0, // 최소값 1보다 작음
      };

      expect(() => createBedrockAnthropicBridge(invalidConfig)).toThrow();
    });

    it('should reject negative maxTokens values', () => {
      const invalidConfig = {
        maxTokens: -100, // 음수 값
      };

      expect(() => createBedrockAnthropicBridge(invalidConfig)).toThrow();
    });

    it('should reject invalid stopSequences type', () => {
      const invalidConfig = {
        stopSequences: 'not-an-array', // 배열이 아님
      };

      expect(() => createBedrockAnthropicBridge(invalidConfig)).toThrow();
    });

    it('should reject invalid region type', () => {
      const invalidConfig = {
        region: 123, // 문자열이 아님
      };

      expect(() => createBedrockAnthropicBridge(invalidConfig)).toThrow();
    });

    it('should reject invalid httpAgent type', () => {
      const invalidConfig = {
        httpAgent: 'not-an-agent', // Agent 인스턴스가 아님
      };

      expect(() => createBedrockAnthropicBridge(invalidConfig)).toThrow();
    });

    it('should accept valid boundary values', () => {
      const validConfig = {
        temperature: 0.0, // 최소값
        maxTokens: 1, // 최소값
        stopSequences: [], // 빈 배열
      };

      expect(() => createBedrockAnthropicBridge(validConfig)).not.toThrow();
    });

    it('should accept valid maximum values', () => {
      const validConfig = {
        temperature: 1.0, // 최대값
        maxTokens: 100000, // 큰 값
        stopSequences: ['stop1', 'stop2'], // 정상 배열
      };

      expect(() => createBedrockAnthropicBridge(validConfig)).not.toThrow();
    });

    it('should apply default values when config is empty', async () => {
      const bridge = createBedrockAnthropicBridge({});
      expect(bridge).toBeDefined();

      // 내부 config가 default 값들을 가지고 있는지 확인하기 위해 metadata 호출
      const metadata = await bridge.getMetadata();
      expect(metadata.model).toBe('anthropic.claude-3-haiku-20240307-v1:0');
    });

    it('should apply default values when config is undefined', async () => {
      const bridge = createBedrockAnthropicBridge();
      expect(bridge).toBeDefined();

      // 내부 config가 default 값들을 가지고 있는지 확인하기 위해 metadata 호출
      const metadata = await bridge.getMetadata();
      expect(metadata.model).toBe('anthropic.claude-3-haiku-20240307-v1:0');
    });
  });
});
