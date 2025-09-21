import type {
  InvokeOption,
  LlmBridge,
  LlmBridgePrompt,
  LlmBridgeResponse,
  LlmMetadata,
} from 'llm-bridge-spec';
import {
  buildChatCompletionRequest,
  mapChatCompletionDelta,
  mapChatCompletionResponse,
  parseSseEvent,
} from './grok-internals';
import { GrokConfig } from './types';

export class GrokBridge implements LlmBridge {
  private proxyInitialized = false;

  constructor(private readonly config: GrokConfig) {}

  async invoke(prompt: LlmBridgePrompt, option: InvokeOption = {}): Promise<LlmBridgeResponse> {
    const body = buildChatCompletionRequest(this.config, prompt.messages, option);
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
      throw new Error(`Grok request failed: ${res.status} ${res.statusText} ${text}`);
    }

    const json: unknown = await res.json();
    return mapChatCompletionResponse(json);
  }

  async *invokeStream(
    prompt: LlmBridgePrompt,
    option: InvokeOption = {}
  ): AsyncIterable<LlmBridgeResponse> {
    const body = buildChatCompletionRequest(this.config, prompt.messages, {
      ...option,
      stream: true,
    });
    const url = new URL('/chat/completions', this.config.baseUrl).toString();

    await this.ensureProxy();
    const { signal, cancel } = createTimeoutSignal(this.config.timeoutMs ?? 60_000);
    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(this.config),
      body: JSON.stringify({ ...body, stream: true, stream_options: { include_usage: true } }),
      signal,
    });
    cancel();

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      throw new Error(`Grok stream failed: ${res.status} ${res.statusText} ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffered = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffered += decoder.decode(value, { stream: true });

      let eventEnd;
      while ((eventEnd = buffered.indexOf('\n\n')) >= 0) {
        const rawEvent = buffered.slice(0, eventEnd);
        buffered = buffered.slice(eventEnd + 2);
        const event = parseSseEvent(rawEvent);
        if (!event) continue;
        if (event.data === '[DONE]') return;
        if (!event.data) continue;
        try {
          const json = JSON.parse(event.data) as unknown;
          for (const chunk of mapChatCompletionDelta(json)) {
            yield chunk;
          }
        } catch {
          // ignore malformed chunk
        }
      }
    }
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'xAI Grok Chat Completions',
      description: 'Bridge for the xAI Grok Chat Completions API',
      model: this.config.model,
      contextWindow: 131_072,
      maxTokens: this.config.maxTokens ?? 32_768,
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

function buildHeaders(config: GrokConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${config.apiKey}`,
  };
  if (config.headers) Object.assign(headers, config.headers);
  return headers;
}

async function setGlobalProxy(url: string): Promise<void> {
  try {
    const mod = await import('undici');
    const agent = new mod.ProxyAgent(url);
    mod.setGlobalDispatcher(agent);
  } catch {
    // ignore if undici is unavailable
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
