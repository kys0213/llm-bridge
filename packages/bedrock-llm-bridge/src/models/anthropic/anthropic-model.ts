import {
  ToolCall as BridgeToolCall,
  InvokeOption,
  LlmBridgeCapabilities,
  LlmBridgePrompt,
  LlmBridgeResponse,
  LlmMetadata,
  Message,
  MultiModalContent,
  MultiModalContentHelper,
  StringContent,
} from 'llm-bridge-spec';
import { AbstractModel } from '../base/abstract-model';
import {
  AnthropicContent,
  AnthropicImageContent,
  AnthropicMessage,
  AnthropicRequestBody,
  AnthropicResponseBody,
  AnthropicResponseContent,
  AnthropicTextContent,
  AnthropicToolUseContent,
} from './types';

export class AnthropicModel extends AbstractModel<AnthropicRequestBody, AnthropicResponseBody> {
  supportsModel(modelId: string): boolean {
    return modelId.startsWith('anthropic.claude');
  }

  buildRequestBody(prompt: LlmBridgePrompt, option?: InvokeOption): AnthropicRequestBody {
    const messages = prompt.messages.map(m => this.toAnthropicMessage(m));

    // max_tokens는 필수 필드이므로 기본값 설정
    const maxTokens = option?.maxTokens ?? 4096;

    return {
      anthropic_version: this.modelId,
      max_tokens: maxTokens,
      messages,
      temperature: option?.temperature,
      top_p: option?.topP,
      top_k: option?.topK,
      stop_sequences: option?.stopSequence,
    };
  }

  parseResponse(response: AnthropicResponseBody): LlmBridgeResponse {
    // content 배열에서 텍스트 추출
    const textContent = response.content
      .filter(c => this.isStringContent(c))
      .map(c => c.text)
      .join('\n');

    const content: StringContent = {
      contentType: 'text',
      value: textContent,
    };

    // tool_use 응답을 ToolCall로 변환
    const toolCalls: BridgeToolCall[] = response.content
      .filter(c => this.isToolUseContent(c))
      .map(c => {
        const toolUse = c;
        return {
          toolCallId: toolUse.id,
          name: toolUse.name,
          arguments: toolUse.input || {},
        };
      });

    const usage = {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    };

    return { content, toolCalls, usage };
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
      description: 'Amazon Bedrock Anthropic LLM Bridge',
      model: this.modelId,
      contextWindow: 200000,
      maxTokens: 4096,
    };
  }

  private toAnthropicMessage(message: Message): AnthropicMessage {
    const role = message.role === 'user' ? 'user' : 'assistant';

    if (message.role === 'tool') {
      // 툴 메시지는 텍스트 콘텐츠만 처리
      const messageContent = Array.isArray(message.content) ? message.content : [message.content];
      const texts = messageContent
        .filter((c): c is StringContent => MultiModalContentHelper.isStringContent(c))
        .map(c => c.value);

      const content: AnthropicContent[] = [
        {
          type: 'text',
          text: texts.join('\n'),
        },
      ];

      return { role: 'user', content }; // tool 메시지는 user로 변환
    }

    // 멀티모달 콘텐츠 배열인 경우 - 타입 안전성 확보
    const messageContent = (
      Array.isArray(message.content) ? message.content : [message.content]
    ).filter((c): c is MultiModalContent => c !== null && c !== undefined);

    const content: AnthropicContent[] = messageContent
      .map((content): AnthropicContent | null => {
        if (content == null) {
          return null;
        }

        if (MultiModalContentHelper.isStringContent(content)) {
          return {
            type: 'text',
            text: content.value,
          };
        }

        if (MultiModalContentHelper.isImageContent(content)) {
          // Buffer인지 string인지 확인 후 적절히 처리
          const imageData = Buffer.isBuffer(content.value)
            ? content.value.toString('base64')
            : String(content.value);

          return {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg', // 기본값, 실제로는 content에서 추출해야 함
              data: imageData,
            },
          };
        }

        return null;
      })
      .filter((c): c is AnthropicContent => c !== null);

    return { role, content: content.length > 0 ? content : [{ type: 'text', text: '' }] };
  }

  private isStringContent(content: AnthropicResponseContent): content is AnthropicTextContent {
    return content.type === 'text';
  }

  private isImageContent(content: AnthropicResponseContent): content is AnthropicImageContent {
    return content.type === 'image';
  }

  private isToolUseContent(content: AnthropicResponseContent): content is AnthropicToolUseContent {
    return content.type === 'tool_use';
  }

  private isVisionModel(): boolean {
    // Claude 3 models support vision
    return this.modelId.includes('claude-3') || this.modelId.includes('claude-3.5');
  }
}
