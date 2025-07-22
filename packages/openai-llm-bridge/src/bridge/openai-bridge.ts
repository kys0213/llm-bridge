import {
  LlmBridge,
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmMetadata,
  StringContent,
  ToolCall as BridgeToolCall,
} from 'llm-bridge-spec';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletion,
  ChatCompletionTool,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat';
import { OpenAIConfig } from './openai-config';
import { ModelMetadata, getModelMetadata, OpenAIModelEnum } from './openai-models';

export class OpenAIBridge implements LlmBridge {
  private config: OpenAIConfig;
  private model: string;
  private modelMetadata: ModelMetadata;

  constructor(
    private client: OpenAI,
    config: OpenAIConfig
  ) {
    this.config = config;
    this.model = config.model ?? OpenAIModelEnum.GPT_4O;
    this.modelMetadata = getModelMetadata(this.model);
  }

  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    const messages = this.toMessages(prompt);
    const tools = this.toTools(option);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      temperature: option?.temperature ?? this.config.temperature,
      top_p: option?.topP ?? this.config.topP,
      max_tokens: option?.maxTokens ?? this.config.maxTokens,
      stop: option?.stopSequence ?? this.config.stopSequences,
      presence_penalty: this.config.presencePenalty,
      frequency_penalty: this.config.frequencyPenalty,
    });

    return this.toLlmBridgeResponse(response);
  }

  async *invokeStream(
    prompt: LlmBridgePrompt,
    option?: InvokeOption
  ): AsyncIterable<LlmBridgeResponse> {
    const messages = this.toMessages(prompt);
    const tools = this.toTools(option);

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      stream: true,
      temperature: option?.temperature ?? this.config.temperature,
      top_p: option?.topP ?? this.config.topP,
      max_tokens: option?.maxTokens ?? this.config.maxTokens,
      stop: option?.stopSequence ?? this.config.stopSequences,
      presence_penalty: this.config.presencePenalty,
      frequency_penalty: this.config.frequencyPenalty,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        const content: StringContent = {
          contentType: 'text',
          value: delta.content,
        };

        yield {
          content,
          toolCalls: [],
          usage: undefined,
        };
      }

      // 도구 호출이 있는 경우 처리
      if (delta.tool_calls) {
        const toolCalls: BridgeToolCall[] = delta.tool_calls.map(tc => ({
          toolCallId: tc.id ?? '',
          name: tc.function?.name ?? '',
          arguments: JSON.parse(tc.function?.arguments ?? '{}'),
        }));

        yield {
          content: { contentType: 'text', value: '' },
          toolCalls,
          usage: undefined,
        };
      }
    }
  }

  async getMetadata(): Promise<LlmMetadata> {
    // 주입된 메타데이터 사용 (분기문 제거)
    return {
      name: `OpenAI ${this.modelMetadata.family}`,
      version: this.modelMetadata.version,
      description: `OpenAI ${this.modelMetadata.family} Bridge Implementation`,
      model: this.model,
      contextWindow: this.modelMetadata.contextWindow,
      maxTokens: this.modelMetadata.maxTokens,
    };
  }

  private toLlmBridgeResponse(res: ChatCompletion): LlmBridgeResponse {
    const message = res.choices[0].message;
    const content: StringContent = {
      contentType: 'text',
      value: message.content ?? '',
    };

    const toolCalls: BridgeToolCall[] = (message.tool_calls || []).map(tc =>
      this.toBridgeToolCall(tc)
    );

    return {
      content,
      toolCalls,
      usage: res.usage
        ? {
            promptTokens: res.usage.prompt_tokens ?? 0,
            completionTokens: res.usage.completion_tokens ?? 0,
            totalTokens: res.usage.total_tokens ?? 0,
          }
        : undefined,
    };
  }

  private toBridgeToolCall(tc: ChatCompletionMessageToolCall): BridgeToolCall {
    return {
      toolCallId: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments ?? '{}'),
    };
  }

  private toMessages(prompt: LlmBridgePrompt): ChatCompletionMessageParam[] {
    const messages: ChatCompletionMessageParam[] = [];

    for (const msg of prompt.messages) {
      if (msg.role === 'tool') {
        messages.push({
          role: 'tool',
          content: msg.content
            .filter(c => c.contentType === 'text')
            .map(c => c.value)
            .join('\n'),
          tool_call_id: msg.toolCallId,
        });
      } else if (msg.content.contentType === 'text') {
        messages.push({ role: msg.role, content: msg.content.value });
      }
    }

    return messages;
  }

  private toTools(option?: InvokeOption): ChatCompletionTool[] {
    if (!option?.tools) return [];
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
