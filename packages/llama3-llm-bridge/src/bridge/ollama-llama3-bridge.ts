import {
  LlmBridge,
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmMetadata,
  ChatMessage,
  StringContent,
} from '@agentos/llm-bridge-spec';
import { Ollama, Message, ChatResponse } from 'ollama';

export class OllamaLlama3Bridge implements LlmBridge {
  private client: Ollama;
  private model: string;

  constructor() {
    this.client = new Ollama();
    this.model = 'llama3.2';
  }

  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    const messages: Message[] = prompt.messages.map((msg: ChatMessage) => ({
      role: msg.role,
      content: msg.content.contentType === 'text' ? msg.content.value : '',
      images:
        msg.content.contentType === 'image' && Buffer.isBuffer(msg.content.value)
          ? [msg.content.value]
          : undefined,
    }));

    const response = await this.client.chat({
      model: this.model,
      messages: messages,
      options: {
        temperature: option?.temperature ?? 0.7,
        top_p: option?.topP ?? 0.9,
        top_k: option?.topK ?? 40,
        num_predict: option?.maxTokens ?? 100,
        stop: option?.stopSequence ?? ['user:'],
      },
    });

    const content: StringContent = {
      contentType: 'text',
      value: response.message.content,
    };

    return {
      content,
      usage: {
        promptTokens: 0, // Ollama API에서 제공하지 않음
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  async *invokeStream(
    prompt: LlmBridgePrompt,
    option?: InvokeOption
  ): AsyncIterable<LlmBridgeResponse> {
    const messages: Message[] = prompt.messages.map((msg: ChatMessage) => ({
      role: msg.role,
      content: msg.content.contentType === 'text' ? msg.content.value : '',
      images:
        msg.content.contentType === 'image' && Buffer.isBuffer(msg.content.value)
          ? [msg.content.value]
          : undefined,
    }));

    for await (const chunk of await this.client.chat({
      model: this.model,
      messages: messages,
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
      name: 'Llama',
      version: '3.2',
      description: 'Llama3 LLM Bridge Implementation',
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

    return {
      content,
      usage: {
        promptTokens: 0, // Ollama API에서 제공하지 않음
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }
}
