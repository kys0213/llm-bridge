import type {
  InvokeOption,
  LlmBridgeResponse,
  Message,
  MultiModalContent,
  StringContent,
  ToolCall as BridgeToolCall,
} from 'llm-bridge-spec';
import type {
  GrokChatCompletionChunk,
  GrokChatCompletionRequest,
  GrokChatCompletionResponse,
  GrokMessage,
  GrokResponseFormat,
  GrokToolCall,
  GrokToolDefinition,
  SseEvent,
} from './grok-api-types';
import type { GrokConfig, GrokSearchConfig, GrokSearchSource } from './types';

export type GrokInvokeOption = InvokeOption & { stream?: boolean };

export function buildChatCompletionRequest(
  config: GrokConfig,
  messages: Message[],
  option: GrokInvokeOption
): GrokChatCompletionRequest {
  const payload: GrokChatCompletionRequest = {
    model: config.model,
    messages: messages.map(toGrokMessage),
    temperature: option.temperature ?? config.temperature,
    top_p: option.topP ?? config.topP,
    max_tokens: option.maxTokens ?? config.maxTokens,
    frequency_penalty: option.frequencyPenalty ?? config.frequencyPenalty,
    presence_penalty: option.presencePenalty ?? config.presencePenalty,
    stop: option.stopSequence ?? config.stopSequences,
    tools: mapTools(option.tools),
    tool_choice: resolveToolChoice(config, option.tools),
    parallel_tool_calls: config.parallelToolCalls,
    response_format: mapResponseFormat(config.responseFormat),
    reasoning_effort: config.reasoningEffort,
    search_parameters: mapSearchParameters(config.search),
    user: config.user,
    conversation_id: config.conversationId,
    store_messages: config.storeMessages,
    previous_response_id: config.previousResponseId,
    seed: config.seed,
    stream: option.stream,
  };

  Object.keys(payload).forEach(key => {
    const value = (payload as Record<string, unknown>)[key];
    if (value === undefined || value === null) {
      delete (payload as Record<string, unknown>)[key];
    }
  });

  return payload;
}

export function toGrokMessage(message: Message): GrokMessage {
  const baseContent = extractTextContent(message.content ?? []);
  switch (message.role) {
    case 'system':
    case 'assistant':
      return { role: message.role, content: baseContent };
    case 'user':
      return { role: 'user', content: baseContent };
    case 'tool':
      return {
        role: 'tool',
        tool_call_id: 'toolCallId' in message ? message.toolCallId : '',
        content: baseContent,
      };
    default:
      return { role: 'user', content: baseContent };
  }
}

export function extractTextContent(contents: MultiModalContent[]): string {
  return contents
    .filter(isStringContent)
    .map(item => item.value ?? '')
    .join('\n');
}

function isStringContent(content: MultiModalContent): content is StringContent {
  return content.contentType === 'text';
}

export function mapChatCompletionResponse(json: unknown): LlmBridgeResponse {
  const obj = json as GrokChatCompletionResponse;
  const choice = obj.choices?.[0];
  const message = choice?.message;
  const text = typeof message?.content === 'string' ? message.content : '';
  const reasoning = typeof message?.reasoning_content === 'string' ? message.reasoning_content : '';
  const citations = Array.isArray(obj.citations) ? obj.citations.filter(Boolean) : [];
  const combined = combineSegments(text, reasoning, citations);
  const content: StringContent = { contentType: 'text', value: combined };

  const toolCalls = (message?.tool_calls ?? [])
    .filter((tool): tool is GrokToolCall => Boolean(tool && tool.id && tool.function))
    .map(tool => mapToolCall(tool));

  const usage = obj.usage
    ? {
        promptTokens: obj.usage.prompt_tokens ?? 0,
        completionTokens: obj.usage.completion_tokens ?? 0,
        totalTokens: obj.usage.total_tokens ?? 0,
      }
    : undefined;

  return { content, usage, toolCalls: toolCalls.length > 0 ? toolCalls : undefined };
}

export function mapChatCompletionDelta(json: unknown): LlmBridgeResponse[] {
  const obj = json as GrokChatCompletionChunk;
  const choice = obj.choices?.[0];
  if (!choice) return [];
  const deltas: LlmBridgeResponse[] = [];

  const textPieces: string[] = [];
  if (typeof choice.delta?.content === 'string' && choice.delta.content.length > 0) {
    textPieces.push(choice.delta.content);
  }
  if (typeof choice.delta?.reasoning_content === 'string' && choice.delta.reasoning_content.length > 0) {
    textPieces.push(choice.delta.reasoning_content);
  }
  if (textPieces.length > 0) {
    deltas.push({ content: { contentType: 'text', value: textPieces.join('\n\n') } });
  }

  const toolCallDeltas = (choice.delta?.tool_calls ?? [])
    .filter((tool): tool is GrokToolCall => Boolean(tool && tool.id && tool.function))
    .map(tool => mapToolCall(tool));
  if (toolCallDeltas.length > 0) {
    deltas.push({
      content: { contentType: 'text', value: '' },
      toolCalls: toolCallDeltas,
    });
  }

  if (obj.usage) {
    deltas.push({
      content: { contentType: 'text', value: '' },
      usage: {
        promptTokens: obj.usage.prompt_tokens ?? 0,
        completionTokens: obj.usage.completion_tokens ?? 0,
        totalTokens: obj.usage.total_tokens ?? 0,
      },
    });
  }

  return deltas;
}

export function mapToolCall(tool: GrokToolCall): BridgeToolCall {
  return {
    toolCallId: tool.id,
    name: tool.function.name,
    arguments: parseToolArguments(tool.function.arguments),
  };
}

function parseToolArguments(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed } as Record<string, unknown>;
  } catch {
    return { __raw: raw };
  }
}

export function mapResponseFormat(format: GrokConfig['responseFormat']): GrokResponseFormat | undefined {
  if (!format) return undefined;
  if (format.type === 'text') return { type: 'text' };
  if (format.type === 'json_object') return { type: 'json_object' };
  return {
    type: 'json_schema',
    json_schema: {
      name: format.name ?? 'response',
      schema: format.schema,
      strict: format.strict,
    },
  };
}

export function mapSearchParameters(search?: GrokSearchConfig): Record<string, unknown> | undefined {
  if (!search) return undefined;
  const mapped: Record<string, unknown> = {};
  if (search.mode) mapped.mode = search.mode;
  if (search.returnCitations !== undefined) mapped.return_citations = search.returnCitations;
  if (search.fromDate) mapped.from_date = search.fromDate;
  if (search.toDate) mapped.to_date = search.toDate;
  if (search.maxSearchResults !== undefined) mapped.max_search_results = search.maxSearchResults;
  if (search.sources) {
    mapped.sources = search.sources.map(source => mapSearchSource(source));
  }
  return mapped;
}

function mapSearchSource(source: GrokSearchSource): Record<string, unknown> {
  const { type } = source;
  const record = source as Record<string, unknown>;
  const mapped: Record<string, unknown> = { type };
  for (const [key, value] of Object.entries(record)) {
    if (key === 'type') continue;
    mapped[toSnakeCase(key)] = value;
  }
  return mapped;
}

function mapTools(tools: InvokeOption['tools']): GrokToolDefinition[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function resolveToolChoice(
  config: GrokConfig,
  tools: InvokeOption['tools']
): GrokChatCompletionRequest['tool_choice'] | undefined {
  if (config.toolChoice) {
    if (config.toolChoice === 'auto' || config.toolChoice === 'none' || config.toolChoice === 'required') {
      return config.toolChoice;
    }
    return { type: 'function', function: { name: config.toolChoice.toolName } };
  }

  if (tools && tools.length > 0) {
    return 'auto';
  }

  return undefined;
}

function toSnakeCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

function combineSegments(text?: string, reasoning?: string, citations?: string[]): string {
  const segments: string[] = [];
  if (text && text.trim().length > 0) segments.push(text);
  if (reasoning && reasoning.trim().length > 0) segments.push(`Reasoning:\n${reasoning}`);
  if (citations && citations.length > 0) {
    segments.push(`Citations:\n${citations.join('\n')}`);
  }
  return segments.join('\n\n');
}

export function parseSseEvent(raw: string): SseEvent | null {
  const lines = raw.split(/\r?\n/);
  const event: SseEvent = {};
  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.startsWith('data:')) {
      const chunk = trimmed.slice(5).trimStart();
      event.data = event.data ? `${event.data}\n${chunk}` : chunk;
    } else if (trimmed.startsWith('event:')) {
      event.event = trimmed.slice(6).trim();
    }
  }
  if (!event.data && !event.event) return null;
  return event;
}
