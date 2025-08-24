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
import type { StringContent } from 'llm-bridge-spec';

export class OpenaiLikeBridge implements LlmBridge {
  private proxyInitialized = false;

  constructor(private readonly config: OpenaiLikeConfig) {}

  async invoke(prompt: LlmBridgePrompt, option: InvokeOption = {}): Promise<LlmBridgeResponse> {
    const body = buildChatCompletionsRequest(prompt.messages, this.config, option);
    const url = new URL('/chat/completions', this.config.baseUrl).toString();

    await this.ensureProxy();
    const { signal, cancel } = createTimeoutSignal(this.config.timeoutMs ?? 60_000);
    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(this.config),
      body: JSON.stringify(body),
      signal,
    });
    cancel();

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI-like request failed: ${res.status} ${res.statusText} ${text}`);
    }

    const json: unknown = await res.json();
    return mapChatCompletionResponse(json);
  }

  async *invokeStream(
    prompt: LlmBridgePrompt,
    option: InvokeOption = {}
  ): AsyncIterable<LlmBridgeResponse> {
    const body = buildChatCompletionsRequest(prompt.messages, this.config, {
      ...option,
      stream: true,
    });
    const url = new URL('/chat/completions', this.config.baseUrl).toString();

    await this.ensureProxy();
    const { signal, cancel } = createTimeoutSignal(this.config.timeoutMs ?? 60_000);
    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(this.config),
      body: JSON.stringify({ ...body, stream: true }),
      signal,
    });
    cancel();

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

  private async ensureProxy(): Promise<void> {
    if (this.proxyInitialized) return;
    const proxyUrl = this.config.proxy?.url || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (!proxyUrl) return;
    await setGlobalProxy(String(proxyUrl));
    this.proxyInitialized = true;
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

async function setGlobalProxy(url: string): Promise<void> {
  try {
    type UndiciLike = {
      ProxyAgent: new (url: string) => unknown;
      setGlobalDispatcher: (agent: unknown) => void;
    };
    const mod = (await import('undici')) as unknown as UndiciLike;
    const agent = new mod.ProxyAgent(url);
    mod.setGlobalDispatcher(agent);
  } catch {
    // undici not available; ignore proxy
  }
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  };
}

type OpenAIChatMessage = { role: 'user' | 'assistant' | 'system' | 'tool'; content: string };

function isStringContent(c: MultiModalContent): c is StringContent {
  return c.contentType === 'text';
}

function toOpenAiMessage(msg: Message): OpenAIChatMessage {
  const contentText = (msg.content || [])
    .filter(isStringContent)
    .map(c => String(c.value ?? ''))
    .join('\n');
  return { role: msg.role, content: contentText };
}

function buildChatCompletionsRequest(
  messages: Message[],
  config: OpenaiLikeConfig,
  option: InvokeOption & { stream?: boolean }
) {
  const payload: Record<string, unknown> = {
    model: config.model,
    messages: messages.map(toOpenAiMessage),
    temperature: option.temperature ?? config.temperature,
    top_p: option.topP ?? config.top_p,
    max_tokens: option.maxTokens ?? config.max_tokens,
    stream: option.stream ?? false,
    response_format: undefined,
  };
  if (config.compatibility?.strict) {
    // in strict mode omit undefined fields
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
  }
  return payload;
}

function mapChatCompletionResponse(json: unknown): LlmBridgeResponse {
  const obj = json as {
    choices?: { message?: { content?: unknown } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const contentText = String(obj?.choices?.[0]?.message?.content ?? '');
  const content: StringContent = { contentType: 'text', value: contentText };
  const usage: LlmUsage | undefined = obj?.usage
    ? {
        promptTokens: obj.usage.prompt_tokens ?? 0,
        completionTokens: obj.usage.completion_tokens ?? 0,
        totalTokens: obj.usage.total_tokens ?? 0,
      }
    : undefined;
  return { content, usage };
}

function mapChatCompletionDelta(json: unknown): LlmBridgeResponse | null {
  const obj = json as { choices?: { delta?: { content?: unknown } }[] };
  const piece = obj?.choices?.[0]?.delta?.content ?? '';
  if (typeof piece !== 'string' || piece.length === 0) return null;
  const content: StringContent = { contentType: 'text', value: piece };
  return { content };
}

export const __internal = {
  toOpenAiMessage,
  buildChatCompletionsRequest,
  mapChatCompletionResponse,
  mapChatCompletionDelta,
};
