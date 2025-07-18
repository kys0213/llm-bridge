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

export interface OllamaGemma3nBridgeOptions {
  host?: string;
  model?: string;
}

export class OllamaGemma3nBridge implements LlmBridge {
  private client: Ollama;
  private host: string;
  private model: string;

  constructor(options?: OllamaGemma3nBridgeOptions) {
    this.host = options?.host ?? 'http://localhost:11434';
    this.client = new Ollama({ host: this.host });
    this.model = options?.model ?? 'gemma3n:latest';
  }

  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    const messages: Message[] = this.toMessages(prompt);

    const tools = this.toTools(option);

    const ollamaResponse = await this.client.chat({
      model: this.model,
      messages: messages,
      tools: tools,
      options: {
        temperature: option?.temperature ?? 0.7,
        top_p: option?.topP ?? 0.9,
        top_k: option?.topK ?? 40,
        num_predict: option?.maxTokens ?? 100,
        stop: option?.stopSequence ?? ['user:'],
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
        temperature: option?.temperature ?? 0.7,
        top_p: option?.topP ?? 0.9,
        top_k: option?.topK ?? 40,
        num_predict: option?.maxTokens ?? 100,
        stop: option?.stopSequence ?? ['user:'],
      },
    })) {
      yield this.toLlmBridgeResponse(chunk);
    }
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'Gemma',
      version: '3n',
      description: 'Gemma 3n LLM Bridge Implementation',
      host: this.host,
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
