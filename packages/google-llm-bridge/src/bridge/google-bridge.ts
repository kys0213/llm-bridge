import {
  InvokeOption,
  LlmBridge,
  LlmBridgePrompt,
  LlmBridgeResponse,
  LlmMetadata,
  Message,
  MultiModalContent,
  StringContent,
  ToolCall as BridgeToolCall,
  ToolMessage,
} from 'llm-bridge-spec';
import {
  BlockReason,
  Content,
  EnhancedGenerateContentResponse,
  FinishReason,
  FunctionCall,
  FunctionDeclaration,
  FunctionDeclarationSchema,
  FunctionCallingMode,
  GenerateContentRequest,
  GenerateContentResult,
  GenerateContentStreamResult,
  GenerationConfig,
  ResponseSchema,
  SafetySetting,
  SchemaType,
  Tool,
  ToolConfig,
  UsageMetadata,
} from '@google/generative-ai';
import { GoogleAIConfig } from './google-config';
import { GoogleModelEnum, ModelMetadata, getModelMetadata } from './google-models';

export interface GenerativeModelLike {
  generateContent(request: GenerateContentRequest): Promise<GenerateContentResult>;
  generateContentStream(request: GenerateContentRequest): Promise<GenerateContentStreamResult>;
}

export interface GenerativeAIClient {
  getGenerativeModel(option: { model: string }): GenerativeModelLike;
}

const BLOCKING_FINISH_REASONS: ReadonlySet<FinishReason> = new Set([
  FinishReason.SAFETY,
  FinishReason.RECITATION,
  FinishReason.BLOCKLIST,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.SPII,
  FinishReason.MALFORMED_FUNCTION_CALL,
  FinishReason.OTHER,
]);

/**
 * Google Generative AI(Gemini) 브릿지 구현
 */
export class GoogleAIBridge implements LlmBridge {
  private readonly model: GoogleModelEnum;
  private readonly metadata: ModelMetadata;

  constructor(
    private readonly client: GenerativeAIClient,
    private readonly config: GoogleAIConfig
  ) {
    this.model = config.model ?? GoogleModelEnum.GEMINI_1_5_FLASH;
    this.metadata = getModelMetadata(this.model);
  }

  async invoke(prompt: LlmBridgePrompt, option: InvokeOption = {}): Promise<LlmBridgeResponse> {
    const model = this.client.getGenerativeModel({ model: this.model });
    const request = this.buildRequest(prompt.messages, option);
    const result = await model.generateContent(request);
    const response = result.response;

    this.ensureResponseAllowed(response);

    return {
      content: this.toBridgeContent(response),
      usage: this.mapUsage(response.usageMetadata),
      toolCalls: this.mapFunctionCalls(response),
    };
  }

  async *invokeStream(
    prompt: LlmBridgePrompt,
    option: InvokeOption = {}
  ): AsyncIterable<LlmBridgeResponse> {
    const model = this.client.getGenerativeModel({ model: this.model });
    const request = this.buildRequest(prompt.messages, option);
    const result = await model.generateContentStream(request);

    let previousText = '';
    const seenToolCalls = new Set<string>();

    for await (const chunk of result.stream) {
      this.ensureResponseAllowed(chunk);

      const chunkText = this.safeText(chunk);
      const delta = chunkText.slice(previousText.length);
      if (delta) {
        previousText = chunkText;
        yield {
          content: { contentType: 'text', value: delta },
          usage: undefined,
          toolCalls: [],
        };
      } else {
        previousText = chunkText;
      }

      const toolCalls = this.filterNewToolCalls(chunk, seenToolCalls);
      if (toolCalls.length > 0) {
        yield {
          content: { contentType: 'text', value: '' },
          usage: undefined,
          toolCalls,
        };
      }
    }

    const finalResponse = await result.response;
    this.ensureResponseAllowed(finalResponse);

    const finalText = this.safeText(finalResponse);
    const remaining = finalText.slice(previousText.length);
    if (remaining) {
      yield {
        content: { contentType: 'text', value: remaining },
        usage: undefined,
        toolCalls: [],
      };
    }

    const usage = this.mapUsage(finalResponse.usageMetadata);
    if (usage) {
      yield {
        content: { contentType: 'text', value: '' },
        usage,
        toolCalls: [],
      };
    }

    const finalToolCalls = this.filterNewToolCalls(finalResponse, seenToolCalls);
    if (finalToolCalls.length > 0) {
      yield {
        content: { contentType: 'text', value: '' },
        usage: undefined,
        toolCalls: finalToolCalls,
      };
    }
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: `Google ${this.metadata.family}`,
      version: this.metadata.version,
      description: this.metadata.description,
      model: this.model,
      contextWindow: this.metadata.contextWindowTokens,
      maxTokens: this.config.maxOutputTokens ?? this.metadata.maxOutputTokens,
    };
  }

  private buildRequest(messages: Message[], option: InvokeOption): GenerateContentRequest {
    const { contents, systemInstruction } = this.toGoogleContents(messages);
    const generationConfig = this.buildGenerationConfig(option);
    const { tools, toolConfig } = this.buildTools(option);

    const request: GenerateContentRequest = {
      contents,
      generationConfig,
      systemInstruction,
    };

    if (this.config.safetySettings) {
      request.safetySettings = this.config.safetySettings as SafetySetting[];
    }
    if (tools) request.tools = tools;
    if (toolConfig) request.toolConfig = toolConfig;

    return request;
  }

  private toGoogleContents(messages: Message[]): {
    contents: Content[];
    systemInstruction?: string | Content;
  } {
    const contents: Content[] = [];
    const systemInstructions: string[] = [];

    for (const message of messages) {
      if (message.role === 'system') {
        const text = this.collectText(message.content);
        if (text) systemInstructions.push(text);
        continue;
      }

      if (message.role === 'tool') {
        contents.push({
          role: 'function',
          parts: [this.toFunctionResponsePart(message)],
        });
        continue;
      }

      const parts = message.content
        .map(content => this.toPart(content))
        .filter((part): part is Content['parts'][number] => Boolean(part));
      if (parts.length > 0) {
        contents.push({
          role: message.role === 'assistant' ? 'model' : message.role,
          parts,
        });
      }
    }

    const systemInstruction =
      systemInstructions.length > 0 ? systemInstructions.join('\n\n') : undefined;

    return { contents, systemInstruction };
  }

  private collectText(contents: MultiModalContent[]): string {
    return contents
      .filter((content): content is StringContent => content.contentType === 'text')
      .map(content => content.value)
      .join('\n');
  }

  private toPart(content: MultiModalContent): Content['parts'][number] | undefined {
    if (content.contentType === 'text') {
      return { text: content.value };
    }

    throw new Error(`Unsupported content type for Gemini bridge: ${content.contentType}`);
  }

  private toFunctionResponsePart(message: ToolMessage): Content['parts'][number] {
    const textPayload = this.collectText(message.content);
    const parsed = this.safeParseJson(textPayload);
    const response =
      parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : textPayload
          ? { result: textPayload }
          : {};

    return {
      functionResponse: {
        name: message.name,
        response,
      },
    };
  }

  private buildGenerationConfig(option: InvokeOption): GenerationConfig | undefined {
    const config: GenerationConfig = {
      temperature: option.temperature ?? this.config.temperature,
      topP: option.topP ?? this.config.topP,
      topK: option.topK ?? this.config.topK,
      stopSequences: option.stopSequence ?? this.config.stopSequences,
      maxOutputTokens:
        option.maxTokens ?? this.config.maxOutputTokens ?? this.metadata.maxOutputTokens,
      candidateCount: this.config.candidateCount,
      responseMimeType: this.config.responseMimeType,
      responseSchema: this.config.responseSchema as ResponseSchema | undefined,
      presencePenalty: option.presencePenalty ?? this.config.presencePenalty,
      frequencyPenalty: option.frequencyPenalty ?? this.config.frequencyPenalty,
    };

    const filtered = Object.entries(config).filter(([, value]) => value !== undefined);
    return filtered.length > 0 ? (Object.fromEntries(filtered) as GenerationConfig) : undefined;
  }

  private buildTools(option: InvokeOption): { tools?: Tool[]; toolConfig?: ToolConfig } {
    if (!option.tools || option.tools.length === 0) {
      return {};
    }

    const functionDeclarations: FunctionDeclaration[] = option.tools.map(tool => {
      const parameters = this.normalizeFunctionParameters(tool.parameters);
      const declaration: FunctionDeclaration = {
        name: tool.name,
        description: tool.description,
      };

      if (parameters) {
        declaration.parameters = parameters;
      }

      return declaration;
    });

    if (functionDeclarations.length === 0) {
      return {};
    }

    const tools: Tool[] = [{ functionDeclarations }];
    const toolConfig: ToolConfig = {
      functionCallingConfig: { mode: FunctionCallingMode.AUTO },
    };

    return { tools, toolConfig };
  }

  private normalizeFunctionParameters(
    parameters?: Record<string, unknown>
  ): FunctionDeclarationSchema | undefined {
    const candidate = parameters as Partial<FunctionDeclarationSchema> | undefined;
    if (!candidate || typeof candidate !== 'object') {
      return undefined;
    }

    const type = 'type' in candidate ? candidate.type : undefined;
    const properties = 'properties' in candidate ? candidate.properties : undefined;
    const isObjectType = typeof type === 'string' && type.toLowerCase() === 'object';

    if (
      isObjectType &&
      properties &&
      typeof properties === 'object' &&
      !Array.isArray(properties)
    ) {
      return candidate as FunctionDeclarationSchema;
    }

    return {
      type: SchemaType.OBJECT,
      properties: {},
    };
  }

  private mapUsage(metadata?: UsageMetadata): LlmBridgeResponse['usage'] {
    if (!metadata) return undefined;

    const promptTokens = metadata.promptTokenCount ?? 0;
    const completionTokens = metadata.candidatesTokenCount ?? 0;
    const totalTokens = metadata.totalTokenCount ?? promptTokens + completionTokens;

    return { promptTokens, completionTokens, totalTokens };
  }

  private mapFunctionCalls(response: EnhancedGenerateContentResponse): BridgeToolCall[] {
    const calls = response.functionCalls?.() ?? [];
    return calls.map(call => this.toBridgeToolCall(call));
  }

  private filterNewToolCalls(
    response: EnhancedGenerateContentResponse,
    seen: Set<string>
  ): BridgeToolCall[] {
    const calls = this.mapFunctionCalls(response);
    const fresh: BridgeToolCall[] = [];

    for (const call of calls) {
      if (seen.has(call.toolCallId)) continue;
      seen.add(call.toolCallId);
      fresh.push(call);
    }

    return fresh;
  }

  private toBridgeToolCall(call: FunctionCall): BridgeToolCall {
    const args = this.ensureRecord(call.args);
    const identifier = JSON.stringify({ name: call.name, args });

    return {
      toolCallId: identifier,
      name: call.name,
      arguments: args,
    };
  }

  private ensureRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private ensureResponseAllowed(response: EnhancedGenerateContentResponse): void {
    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason && blockReason !== BlockReason.BLOCKED_REASON_UNSPECIFIED) {
      throw new Error(`Gemini request blocked: ${blockReason}`);
    }

    for (const candidate of response.candidates ?? []) {
      if (!candidate.finishReason) continue;
      if (BLOCKING_FINISH_REASONS.has(candidate.finishReason)) {
        throw new Error(`Gemini response blocked: ${candidate.finishReason}`);
      }
    }
  }

  private safeText(response: EnhancedGenerateContentResponse): string {
    try {
      return response.text();
    } catch {
      return '';
    }
  }

  private toBridgeContent(response: EnhancedGenerateContentResponse): StringContent {
    return {
      contentType: 'text',
      value: this.safeText(response),
    };
  }

  private safeParseJson(value: string): unknown {
    if (!value) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
}
