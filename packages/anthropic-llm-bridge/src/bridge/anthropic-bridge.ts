import {
  LlmBridge,
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmMetadata,
  StringContent,
  ToolCall as BridgeToolCall,
} from 'llm-bridge-spec';
import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  Message,
  Tool,
  ToolUseBlock,
} from '@anthropic-ai/sdk/resources/messages';
import { AnthropicConfig } from './anthropic-config';
import {
  ModelMetadata,
  getModelMetadata,
  AnthropicModelEnum,
  supportsLongContext,
} from './anthropic-models';

export class AnthropicBridge implements LlmBridge {
  private config: AnthropicConfig;
  private model: string;
  private modelMetadata: ModelMetadata;

  constructor(
    private client: Anthropic,
    config: AnthropicConfig
  ) {
    this.config = config;
    this.model = config.model ?? AnthropicModelEnum.CLAUDE_SONNET_4;
    this.modelMetadata = getModelMetadata(this.model);
  }

  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    const messages = this.toMessages(prompt);
    const tools = this.toTools(option);
    const headers = this.getHeaders();

    const response = await this.client.messages.create(
      {
        model: this.model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        max_tokens: option?.maxTokens ?? this.config.maxTokens ?? this.modelMetadata.maxTokens,
        temperature: option?.temperature ?? this.config.temperature,
        top_p: option?.topP ?? this.config.topP,
        stop_sequences: option?.stopSequence ?? this.config.stopSequences,
      },
      { headers }
    );

    return this.toLlmBridgeResponse(response);
  }

  async *invokeStream(
    prompt: LlmBridgePrompt,
    option?: InvokeOption
  ): AsyncIterable<LlmBridgeResponse> {
    const messages = this.toMessages(prompt);
    const tools = this.toTools(option);
    const headers = this.getHeaders();

    const stream = await this.client.messages.create(
      {
        model: this.model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        max_tokens: option?.maxTokens ?? this.config.maxTokens ?? this.modelMetadata.maxTokens,
        temperature: option?.temperature ?? this.config.temperature,
        top_p: option?.topP ?? this.config.topP,
        stop_sequences: option?.stopSequence ?? this.config.stopSequences,
        stream: true,
      },
      { headers }
    );

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const content: StringContent = {
          contentType: 'text',
          value: chunk.delta.text,
        };

        yield {
          content,
          toolCalls: [],
          usage: undefined,
        };
      }

      if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
        const toolCall: BridgeToolCall = {
          toolCallId: chunk.content_block.id,
          name: chunk.content_block.name,
          arguments: chunk.content_block.input as Record<string, unknown>,
        };

        yield {
          content: { contentType: 'text', value: '' },
          toolCalls: [toolCall],
          usage: undefined,
        };
      }
    }
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: `Anthropic ${this.modelMetadata.family}`,
      version: this.modelMetadata.version,
      description: `Anthropic ${this.modelMetadata.family} Bridge Implementation`,
      model: this.model,
      contextWindow: this.modelMetadata.contextWindowTokens,
      maxTokens: this.modelMetadata.maxTokens,
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.useLongContext && supportsLongContext(this.model)) {
      headers['anthropic-beta'] = 'context-1m-2025-08-07';
    }

    if (this.config.useExtendedOutput) {
      headers['anthropic-beta'] = headers['anthropic-beta']
        ? `${headers['anthropic-beta']},output-128k-2025-02-19`
        : 'output-128k-2025-02-19';
    }

    return headers;
  }

  private toLlmBridgeResponse(res: Message): LlmBridgeResponse {
    const textContent = res.content.find(c => c.type === 'text');
    const content: StringContent = {
      contentType: 'text',
      value: textContent?.type === 'text' ? textContent.text : '',
    };

    const toolCalls: BridgeToolCall[] = res.content
      .filter((c): c is ToolUseBlock => c.type === 'tool_use')
      .map(tc => ({
        toolCallId: tc.id,
        name: tc.name,
        arguments: tc.input as Record<string, unknown>,
      }));

    return {
      content,
      toolCalls,
      usage: res.usage
        ? {
            promptTokens: res.usage.input_tokens ?? 0,
            completionTokens: res.usage.output_tokens ?? 0,
            totalTokens: (res.usage.input_tokens ?? 0) + (res.usage.output_tokens ?? 0),
          }
        : undefined,
    };
  }

  private toMessages(prompt: LlmBridgePrompt): MessageParam[] {
    const messages: MessageParam[] = [];

    for (const msg of prompt.messages) {
      if (msg.role === 'tool') {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.toolCallId,
              content: msg.content
                .filter(c => c.contentType === 'text')
                .map(c => c.value)
                .join('\n'),
            },
          ],
        });
      } else if (msg.role === 'system') {
        continue;
      } else {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
            .filter(c => c.contentType === 'text')
            .map(c => c.value)
            .join('\n'),
        });
      }
    }

    const systemMessage = prompt.messages.find(msg => msg.role === 'system');
    if (systemMessage) {
      const systemContent = systemMessage.content
        .filter(c => c.contentType === 'text')
        .map(c => c.value)
        .join('\n');

      return messages.map((msg, index) =>
        index === 0
          ? {
              ...msg,
              content: `${systemContent}\n\n${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}`,
            }
          : msg
      );
    }

    return messages;
  }

  private toTools(option?: InvokeOption): Tool[] {
    if (!option?.tools) return [];
    return option.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        ...tool.parameters,
      },
    }));
  }
}
