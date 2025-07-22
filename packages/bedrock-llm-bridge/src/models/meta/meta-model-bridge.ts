import {
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmBridgeCapabilities,
  LlmMetadata,
  StringContent,
  ToolCall as BridgeToolCall,
  ImageContent,
} from 'llm-bridge-spec';
import { BedrockModelBridge } from '../base/bedrock-model-bridge';

export class MetaModelBridge extends BedrockModelBridge {
  supportsModel(modelId: string): boolean {
    return modelId.startsWith('meta.llama');
  }

  buildRequestBody(prompt: LlmBridgePrompt, option?: InvokeOption): any {
    const messages = this.toMessages(prompt);
    return {
      messages,
      temperature: option?.temperature,
      top_p: option?.topP,
      max_tokens: option?.maxTokens,
      stop_sequences: option?.stopSequence,
    };
  }

  parseResponse(response: any): LlmBridgeResponse {
    const content: StringContent = {
      contentType: 'text',
      value: response.generation ?? response.output ?? '',
    };
    const toolCalls: BridgeToolCall[] = [];
    return { content, toolCalls, usage: undefined };
  }

  getCapabilities(): LlmBridgeCapabilities {
    return {
      modalities: ['text'],
      supportsToolCall: false,
      supportsFunctionCall: false,
      supportsMultiTurn: true,
      supportsStreaming: true,
      supportsVision: false,
    };
  }

  getMetadata(): LlmMetadata {
    return {
      name: 'Meta Llama',
      version: '3',
      description: 'Amazon Bedrock Meta Llama Bridge',
      model: this.modelId,
      contextWindow: 8192,
      maxTokens: 4096,
    };
  }

  private toMessages(prompt: LlmBridgePrompt) {
    return prompt.messages.map(m => {
      if (m.role === 'tool') {
        const images = (m.content as ImageContent[]).filter(c => c.contentType === 'image');
        return {
          role: m.role,
          content: (m.content as any[])
            .filter(c => c.contentType === 'text')
            .map(c => c.value)
            .join('\n'),
          images: images.map(i => i.value) as Buffer[],
        };
      }
      return {
        role: m.role,
        content: m.content.contentType === 'text' ? m.content.value : '',
      };
    });
  }
}
