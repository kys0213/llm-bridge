import {
  LlmBridge,
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmMetadata,
  StringContent,
  ToolCall as BridgeToolCall,
  Message,
} from 'llm-bridge-spec';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletion,
  ChatCompletionTool,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat';

export class OpenAIGpt4Bridge implements LlmBridge {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, baseUrl?: string, model: string = 'gpt-4o') {
    this.client = new OpenAI({ apiKey, baseURL: baseUrl });
    this.model = model;
  }

  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    const messages = this.toMessages(prompt);
    const tools = this.toTools(option);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      temperature: option?.temperature,
      top_p: option?.topP,
      max_tokens: option?.maxTokens,
      stop: option?.stopSequence,
    });

    return this.toLlmBridgeResponse(response);
  }

  async *invokeStream(
    prompt: LlmBridgePrompt,
    option?: InvokeOption,
  ): AsyncIterable<LlmBridgeResponse> {
    const messages = this.toMessages(prompt);
    const tools = this.toTools(option);

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      stream: true,
      temperature: option?.temperature,
      top_p: option?.topP,
      max_tokens: option?.maxTokens,
      stop: option?.stopSequence,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;
      if (delta.content) {
        yield {
          content: { contentType: 'text', value: delta.content },
        };
      }
    }
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'OpenAI GPT-4',
      version: '4',
      description: 'OpenAI GPT-4 Bridge Implementation',
      model: this.model,
      contextWindow: 128000,
      maxTokens: 4096,
    };
  }

  private toLlmBridgeResponse(res: ChatCompletion): LlmBridgeResponse {
    const message = res.choices[0].message;
    const content: StringContent = {
      contentType: 'text',
      value: message.content ?? '',
    };

    const toolCalls: BridgeToolCall[] = (message.tool_calls || []).map(tc => this.toBridgeToolCall(tc));

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
            .map(c => (c as StringContent).value)
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
