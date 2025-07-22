import {
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmBridgeCapabilities,
  LlmMetadata,
  StringContent,
  Message,
  MultiModalContent,
} from 'llm-bridge-spec';
import { BedrockModelBridge } from '../base/bedrock-model-bridge';

export class AnthropicModelBridge extends BedrockModelBridge {
  supportsModel(modelId: string): boolean {
    return modelId.startsWith('anthropic.claude');
  }

  buildRequestBody(prompt: LlmBridgePrompt, option?: InvokeOption): any {
    const messages = prompt.messages.map(m => this.toAnthropicMessage(m));

    return {
      messages,
      temperature: option?.temperature,
      top_p: option?.topP,
      top_k: option?.topK,
      max_tokens: option?.maxTokens,
      stop_sequences: option?.stopSequence,
    };
  }

  parseResponse(response: any): LlmBridgeResponse {
    const content: StringContent = {
      contentType: 'text',
      value: response.content ?? response.completion ?? response.result ?? response.output ?? '',
    };

    const usage = response.usage
      ? {
          promptTokens: response.usage.input_tokens ?? 0,
          completionTokens: response.usage.output_tokens ?? 0,
          totalTokens: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
        }
      : undefined;

    return { content, usage };
  }

  getCapabilities(): LlmBridgeCapabilities {
    return {
      modalities: ['text'],
      supportsToolCall: true,
      supportsFunctionCall: true,
      supportsMultiTurn: true,
      supportsStreaming: true,
      supportsVision: this.isVisionModel(),
    };
  }

  getMetadata(): LlmMetadata {
    return {
      name: 'Anthropic Claude',
      version: '3',
      description: 'Amazon Bedrock Anthropic LLM Bridge',
      model: this.modelId,
      contextWindow: 200000,
      maxTokens: 4096,
    };
  }

  private toAnthropicMessage(message: Message): { role: string; content: string } {
    if (message.role === 'tool') {
      const tool = message;
      const texts = tool.content
        .filter((c): c is StringContent => this.isStringContent(c))
        .map(c => c.value);
      return { role: tool.role, content: texts.join('\n') };
    }

    if (this.isStringContent(message.content)) {
      return { role: message.role, content: message.content.value };
    }

    return { role: message.role, content: '' };
  }

  private isStringContent(content: MultiModalContent): content is StringContent {
    return (content as StringContent).contentType === 'text';
  }

  private isVisionModel(): boolean {
    // Claude 3 models support vision
    return this.modelId.includes('claude-3') || this.modelId.includes('claude-3.5');
  }
}
