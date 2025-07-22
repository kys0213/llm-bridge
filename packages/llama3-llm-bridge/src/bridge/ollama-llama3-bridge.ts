import {
  LlmBridge,
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmMetadata,
  StringContent,
  ToolCall as BridgeToolCall,
  ImageContent,
} from 'llm-bridge-spec';
import { Ollama, Message, ChatResponse, Tool, ToolCall } from 'ollama';
import { z } from 'zod';

// Zod 스키마 정의
export const OllamaLlama3ConfigSchema = z.object({
  // Ollama 서버 설정
  host: z.string().optional().describe('Ollama server host URL'),

  // 모델 설정
  model: z.string().optional().describe('Llama model name (e.g., llama3.2, llama3.1, llama3)'),

  // 모델 파라미터 (기본값)
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe('Sampling temperature for response generation'),
  topP: z.number().min(0).max(1).optional().describe('Top-p nucleus sampling parameter'),
  topK: z.number().min(0).optional().describe('Top-k sampling parameter'),
  maxTokens: z.number().min(1).optional().describe('Maximum number of tokens to generate'),
  stopSequences: z
    .array(z.string())
    .optional()
    .describe('Array of strings that will stop generation'),
});

// 타입 추출
export type OllamaLlama3Config = z.infer<typeof OllamaLlama3ConfigSchema>;

export class OllamaLlama3Bridge implements LlmBridge {
  private config: OllamaLlama3Config;
  private model: string;

  constructor(
    private client: Ollama,
    config?: OllamaLlama3Config
  ) {
    this.config = config ?? {};
    this.model = this.config.model ?? 'llama3.2';
  }

  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    const messages: Message[] = this.toMessages(prompt);
    const tools = this.toTools(option);

    const ollamaResponse = await this.client.chat({
      model: this.model,
      messages: messages,
      tools: tools,
      options: {
        temperature: option?.temperature ?? this.config.temperature ?? 0.7,
        top_p: option?.topP ?? this.config.topP ?? 0.9,
        top_k: option?.topK ?? this.config.topK ?? 40,
        num_predict: option?.maxTokens ?? this.config.maxTokens ?? 100,
        stop: option?.stopSequence ?? this.config.stopSequences ?? ['user:'],
      },
    });

    return this.toLlmBridgeResponse(ollamaResponse);
  }

  async *invokeStream(
    prompt: LlmBridgePrompt,
    option?: InvokeOption
  ): AsyncIterable<LlmBridgeResponse> {
    const messages: Message[] = this.toMessages(prompt);
    const tools: Tool[] = this.toTools(option);

    for await (const chunk of await this.client.chat({
      model: this.model,
      messages: messages,
      tools: tools,
      stream: true,
      options: {
        temperature: option?.temperature ?? this.config.temperature ?? 0.7,
        top_p: option?.topP ?? this.config.topP ?? 0.9,
        top_k: option?.topK ?? this.config.topK ?? 40,
        num_predict: option?.maxTokens ?? this.config.maxTokens ?? 100,
        stop: option?.stopSequence ?? this.config.stopSequences ?? ['user:'],
      },
    })) {
      yield this.toLlmBridgeResponse(chunk);
    }
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'Ollama Llama',
      version: '3.2',
      description: 'Ollama Llama3 LLM Bridge Implementation',
      model: this.model,
      contextWindow: 4096,
      maxTokens: 2048,
    };
  }

  private toLlmBridgeResponse(response: ChatResponse): LlmBridgeResponse {
    const content: StringContent = {
      contentType: 'text',
      value: response.message.content,
    };

    const toolCalls: BridgeToolCall[] = response.message.tool_calls
      ? response.message.tool_calls.map(toolCall => this.toBridgeToolCall(toolCall))
      : [];

    return {
      content,
      toolCalls,
      usage: {
        promptTokens: 0, // Ollama API에서 제공하지 않음
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  private toBridgeToolCall(toolCall: ToolCall): BridgeToolCall {
    return {
      toolCallId: 'unknown',
      name: toolCall.function.name,
      arguments: toolCall.function.arguments as Record<string, unknown>,
    };
  }

  private toMessages(prompt: LlmBridgePrompt): Message[] {
    const messages: Message[] = [];

    for (const message of prompt.messages) {
      if (message.role === 'tool') {
        const images: ImageContent[] = message.content.filter(
          content => content.contentType === 'image' && Buffer.isBuffer(content.value)
        ) as ImageContent[];

        const textContents = message.content.filter(
          (content): content is StringContent => content.contentType === 'text'
        );
        messages.push({
          role: message.role,
          content: textContents.map(c => c.value).join('\n'),
          images: images.map(image => image.value) as Buffer[],
        });
      } else {
        messages.push({
          role: message.role,
          content: message.content.contentType === 'text' ? message.content.value : '',
          images:
            message.content.contentType === 'image' && Buffer.isBuffer(message.content.value)
              ? [message.content.value]
              : undefined,
        });
      }
    }

    return messages;
  }

  private toTools(option: InvokeOption | undefined): Tool[] {
    if (!option?.tools) {
      return [];
    }

    return option.tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
}

/**
 * Factory function to create OllamaLlama3Bridge with properly configured dependencies
 * Includes runtime validation using Zod schema
 */
export function createOllamaLlama3Bridge(config?: OllamaLlama3Config): OllamaLlama3Bridge {
  // 런타임 검증 - 잘못된 설정이 들어오면 즉시 에러
  const parsedConfig = config ? OllamaLlama3ConfigSchema.parse(config) : {};

  // Apply defaults
  const validatedConfig: OllamaLlama3Config = {
    host: 'http://localhost:11434',
    model: 'llama3.2',
    ...parsedConfig,
  };

  // Ollama 클라이언트 생성
  const client = new Ollama({ host: validatedConfig.host });

  return new OllamaLlama3Bridge(client, validatedConfig);
}
