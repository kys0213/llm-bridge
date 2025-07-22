import { describe, it, expect, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { OllamaLlama3Bridge, createOllamaLlama3Bridge } from '../bridge/ollama-llama3-bridge';
import { LlmBridgePrompt } from 'llm-bridge-spec';
import { Ollama } from 'ollama';

describe('OllamaLlama3Bridge', () => {
  let mockClient: ReturnType<typeof mock<Ollama>>;
  let bridge: OllamaLlama3Bridge;

  beforeEach(() => {
    mockClient = mock<Ollama>();
    bridge = new OllamaLlama3Bridge(mockClient);
  });

  describe('constructor', () => {
    it('should create bridge with default config', () => {
      expect(bridge).toBeDefined();
    });

    it('should create bridge with custom config', () => {
      const config = {
        host: 'http://custom-host:11434',
        model: 'llama3.1',
        temperature: 0.5,
        maxTokens: 1000,
      };
      const customBridge = new OllamaLlama3Bridge(mockClient, config);
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
        message: {
          content: 'Hello! I am doing well, thank you for asking.',
          tool_calls: [],
        },
      };

      mockClient.chat.mockResolvedValue(mockResponse);

      const result = await bridge.invoke(samplePrompt);

      expect(result).toBeDefined();
      expect(result.content.contentType).toBe('text');
      expect(result.content.value).toBe('Hello! I am doing well, thank you for asking.');
      expect(result.toolCalls).toEqual([]);
      expect(result.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it('should handle tool calls in response', async () => {
      const mockResponse = {
        message: {
          content: 'I will help you with that.',
          tool_calls: [
            {
              function: {
                name: 'get_weather',
                arguments: { location: 'Seoul' },
              },
            },
          ],
        },
      };

      mockClient.chat.mockResolvedValue(mockResponse);

      const result = await bridge.invoke(samplePrompt);
      expect(result.content.value).toBe('I will help you with that.');
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls?.[0].name).toBe('get_weather');
      expect(result.toolCalls?.[0].arguments).toEqual({ location: 'Seoul' });
    });

    it('should pass invoke options to the model', async () => {
      const mockResponse = {
        message: {
          content: 'Test response',
          tool_calls: [],
        },
      };

      mockClient.chat.mockResolvedValue(mockResponse);

      const options = {
        temperature: 0.8,
        topP: 0.9,
        topK: 50,
        maxTokens: 500,
        stopSequence: ['stop'],
        tools: [
          {
            name: 'test_tool',
            description: 'A test tool',
            parameters: { type: 'object' },
          },
        ],
      };

      await bridge.invoke(samplePrompt, options);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama3.2',
          messages: expect.any(Array),
          tools: expect.any(Array),
          options: expect.objectContaining({
            temperature: 0.8,
            top_p: 0.9,
            top_k: 50,
            num_predict: 500,
            stop: ['stop'],
          }),
        })
      );
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
        message: {
          content: 'Tool response',
          tool_calls: [],
        },
      };

      mockClient.chat.mockResolvedValue(mockResponse);

      const result = await bridge.invoke(toolPrompt);
      expect(result.content.value).toBe('Tool response');
    });

    it('should use config default parameters', async () => {
      const config = {
        temperature: 0.3,
        topP: 0.7,
        topK: 30,
        maxTokens: 2000,
        stopSequences: ['END'],
      };
      const bridgeWithDefaults = new OllamaLlama3Bridge(mockClient, config);

      const mockResponse = {
        message: {
          content: 'Config defaults test',
          tool_calls: [],
        },
      };

      mockClient.chat.mockResolvedValue(mockResponse);

      await bridgeWithDefaults.invoke(samplePrompt);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            temperature: 0.3,
            top_p: 0.7,
            top_k: 30,
            num_predict: 2000,
            stop: ['END'],
          }),
        })
      );
    });
  });

  describe('invokeStream', () => {
    const samplePrompt: LlmBridgePrompt = {
      messages: [
        {
          role: 'user',
          content: {
            contentType: 'text',
            value: 'Hello!',
          },
        },
      ],
    };

    it('should handle streaming responses', async () => {
      const mockStreamResponse = [
        {
          message: {
            content: 'Hello',
            tool_calls: [],
          },
        },
        {
          message: {
            content: ' there!',
            tool_calls: [],
          },
        },
      ];

      // Mock async iterator
      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of mockStreamResponse) {
            yield chunk;
          }
        },
      };

      mockClient.chat.mockResolvedValue(mockAsyncIterator);

      const results = [];
      for await (const chunk of bridge.invokeStream(samplePrompt)) {
        results.push(chunk);
      }

      expect(results).toHaveLength(2);
      expect(results[0].content.value).toBe('Hello');
      expect(results[1].content.value).toBe(' there!');
    });
  });

  describe('getMetadata', () => {
    it('should return bridge metadata', async () => {
      const metadata = await bridge.getMetadata();

      expect(metadata).toEqual({
        name: 'Ollama Llama',
        version: '3.2',
        description: 'Ollama Llama3 LLM Bridge Implementation',
        model: 'llama3.2',
        contextWindow: 4096,
        maxTokens: 2048,
      });
    });

    it('should return custom model in metadata', async () => {
      const customBridge = new OllamaLlama3Bridge(mockClient, {
        model: 'llama3.1',
      });

      const metadata = await customBridge.getMetadata();
      expect(metadata.model).toBe('llama3.1');
    });
  });

  describe('error handling', () => {
    it('should handle client errors', async () => {
      mockClient.chat.mockRejectedValue(new Error('Ollama Server Error'));

      const samplePrompt: LlmBridgePrompt = {
        messages: [
          {
            role: 'user',
            content: { contentType: 'text', value: 'test' },
          },
        ],
      };

      await expect(bridge.invoke(samplePrompt)).rejects.toThrow('Ollama Server Error');
    });
  });
});

describe('createOllamaLlama3Bridge', () => {
  describe('basic functionality', () => {
    it('should create bridge with default configuration', () => {
      const bridge = createOllamaLlama3Bridge();
      expect(bridge).toBeDefined();
    });

    it('should create bridge with custom host and model', () => {
      const config = {
        host: 'http://custom-ollama:11434',
        model: 'llama3.1',
        temperature: 0.7,
      };

      const bridge = createOllamaLlama3Bridge(config);
      expect(bridge).toBeDefined();
    });

    it('should create bridge with complete configuration', () => {
      const config = {
        host: 'http://localhost:11434',
        model: 'llama3.2',
        temperature: 0.5,
        topP: 0.8,
        topK: 40,
        maxTokens: 1000,
        stopSequences: ['Human:', 'Assistant:'],
      };

      const bridge = createOllamaLlama3Bridge(config);
      expect(bridge).toBeDefined();
    });
  });

  describe('런타임 검증', () => {
    it('should reject invalid temperature values', () => {
      const invalidConfig = {
        temperature: 3.0, // 범위를 벗어남 (0-2 이어야 함)
      };

      expect(() => createOllamaLlama3Bridge(invalidConfig)).toThrow();
    });

    it('should reject negative temperature values', () => {
      const invalidConfig = {
        temperature: -0.1, // 음수 값
      };

      expect(() => createOllamaLlama3Bridge(invalidConfig)).toThrow();
    });

    it('should reject invalid topP values', () => {
      const invalidConfig = {
        topP: 1.5, // 범위를 벗어남 (0-1 이어야 함)
      };

      expect(() => createOllamaLlama3Bridge(invalidConfig)).toThrow();
    });

    it('should reject negative topP values', () => {
      const invalidConfig = {
        topP: -0.1, // 음수 값
      };

      expect(() => createOllamaLlama3Bridge(invalidConfig)).toThrow();
    });

    it('should reject invalid maxTokens values', () => {
      const invalidConfig = {
        maxTokens: 0, // 최소값 1보다 작음
      };

      expect(() => createOllamaLlama3Bridge(invalidConfig)).toThrow();
    });

    it('should reject negative maxTokens values', () => {
      const invalidConfig = {
        maxTokens: -100, // 음수 값
      };

      expect(() => createOllamaLlama3Bridge(invalidConfig)).toThrow();
    });

    it('should reject negative topK values', () => {
      const invalidConfig = {
        topK: -1, // 음수 값
      };

      expect(() => createOllamaLlama3Bridge(invalidConfig)).toThrow();
    });

    it('should accept valid boundary values', () => {
      const validConfig = {
        temperature: 0.0, // 최소값
        topP: 0.0, // 최소값
        topK: 0, // 최소값
        maxTokens: 1, // 최소값
        stopSequences: [], // 빈 배열
      };

      expect(() => createOllamaLlama3Bridge(validConfig)).not.toThrow();
    });

    it('should accept valid maximum values', () => {
      const validConfig = {
        temperature: 2.0, // 최대값
        topP: 1.0, // 최대값
        topK: 1000, // 큰 값
        maxTokens: 100000, // 큰 값
        stopSequences: ['stop1', 'stop2'], // 정상 배열
      };

      expect(() => createOllamaLlama3Bridge(validConfig)).not.toThrow();
    });

    it('should apply default values when config is empty', async () => {
      const bridge = createOllamaLlama3Bridge({});
      expect(bridge).toBeDefined();

      // 내부 config가 default 값들을 가지고 있는지 확인하기 위해 metadata 호출
      const metadata = await bridge.getMetadata();
      expect(metadata.model).toBe('llama3.2');
    });

    it('should apply default values when config is undefined', async () => {
      const bridge = createOllamaLlama3Bridge();
      expect(bridge).toBeDefined();

      // 내부 config가 default 값들을 가지고 있는지 확인하기 위해 metadata 호출
      const metadata = await bridge.getMetadata();
      expect(metadata.model).toBe('llama3.2');
    });
  });
});
