import type {
  InvokeOption,
  LlmBridge,
  LlmBridgePrompt,
  LlmBridgeResponse,
  LlmMetadata,
  LlmUsage,
  Message,
  MultiModalContent,
} from 'llm-bridge-spec';

import { OpenaiLikeConfig } from './types';

export class OpenaiLikeBridge implements LlmBridge {
  constructor(private readonly config: OpenaiLikeConfig) {}

  async invoke(prompt: LlmBridgePrompt, option: InvokeOption = {}): Promise<LlmBridgeResponse> {
    const body = buildChatCompletionsRequest(prompt.messages, this.config, option);
    const url = new URL('/chat/completions', this.config.baseUrl).toString();

    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(this.config),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI-like request failed: ${res.status} ${res.statusText} ${text}`);
    }

    const json = (await res.json()) as any;
    return mapChatCompletionResponse(json);
  }

  async *invokeStream(
    prompt: LlmBridgePrompt,
    option: InvokeOption = {}
  ): AsyncIterable<LlmBridgeResponse> {
    const body = buildChatCompletionsRequest(prompt.messages, this.config, {
      ...option,
      stream: true,
    } as any);
    const url = new URL('/chat/completions', this.config.baseUrl).toString();

    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(this.config),
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI-like stream failed: ${res.status} ${res.statusText} ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffered = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffered += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffered.indexOf('\n')) >= 0) {
        const line = buffered.slice(0, idx).trim();
        buffered = buffered.slice(idx + 1);
        if (!line) continue;
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') return;
          try {
            const json = JSON.parse(data);
            const mapped = mapChatCompletionDelta(json);
            if (mapped) yield mapped;
          } catch {
            // ignore malformed chunks
          }
        }
      }
    }
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'OpenAI-Compatible Chat Completions',
      description: 'Generic OpenAI-like bridge (vLLM and similar)',
      model: this.config.model,
      contextWindow: 128_000,
      maxTokens: 4_096,
    };
  }
}

function buildHeaders(config: OpenaiLikeConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${config.apiKey ?? ''}`,
  };
  if (config.organization) headers['openai-organization'] = config.organization;
  if (config.headers) Object.assign(headers, config.headers);
  return headers;
}

function toOpenAiMessage(msg: Message): { role: string; content: string } {
  const contentText = (msg.content || [])
    .filter(c => c.contentType === 'text')
    .map(c => String((c as any).value ?? ''))
    .join('\n');
  return { role: msg.role, content: contentText } as any;
}

function buildChatCompletionsRequest(
  messages: Message[],
  config: OpenaiLikeConfig,
  option: InvokeOption & { stream?: boolean }
) {
  const payload: any = {
    model: config.model,
    messages: messages.map(toOpenAiMessage),
    temperature: option.temperature ?? config.temperature,
    top_p: option.topP ?? config.top_p,
    max_tokens: option.maxTokens ?? config.max_tokens,
    stream: (option as any).stream ?? false,
    response_format: undefined,
  };
  if (config.compatibility?.strict) {
    // in strict mode omit undefined fields
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
  }
  return payload;
}

function mapChatCompletionResponse(json: any): LlmBridgeResponse {
  const contentText: string = json?.choices?.[0]?.message?.content ?? '';
  const content: MultiModalContent = { contentType: 'text', value: String(contentText) } as any;
  const usage: LlmUsage | undefined = json?.usage
    ? {
        promptTokens: json.usage.prompt_tokens ?? 0,
        completionTokens: json.usage.completion_tokens ?? 0,
        totalTokens: json.usage.total_tokens ?? 0,
      }
    : undefined;
  return { content, usage };
}

function mapChatCompletionDelta(json: any): LlmBridgeResponse | null {
  const delta = json?.choices?.[0]?.delta;
  const piece = delta?.content ?? '';
  if (typeof piece !== 'string' || piece.length === 0) return null;
  const content: MultiModalContent = { contentType: 'text', value: piece } as any;
  return { content };
}

export const __internal = {
  toOpenAiMessage,
  buildChatCompletionsRequest,
  mapChatCompletionResponse,
  mapChatCompletionDelta,
};
