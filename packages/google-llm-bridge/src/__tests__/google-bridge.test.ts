import { describe, it, expect, beforeEach } from 'vitest';
import type {
  EnhancedGenerateContentResponse,
  FunctionCall,
  GenerateContentRequest,
  GenerateContentResult,
  GenerateContentStreamResult,
  UsageMetadata,
} from '@google/generative-ai';
import { BlockReason, FunctionCallingMode } from '@google/generative-ai';
import { LlmBridgePrompt, LlmBridgeResponse } from 'llm-bridge-spec';
import { GoogleAIBridge, GenerativeAIClient, GenerativeModelLike } from '../bridge/google-bridge';
import { GoogleAIConfig } from '../bridge/google-config';
import { GoogleModelEnum } from '../bridge/google-models';

class MockGenerativeModel implements GenerativeModelLike {
  public generateResponse: EnhancedGenerateContentResponse = createResponse();
  public streamChunks: EnhancedGenerateContentResponse[] = [];
  public streamFinal?: EnhancedGenerateContentResponse;
  public lastRequest?: GenerateContentRequest;
  public lastStreamRequest?: GenerateContentRequest;

  async generateContent(request: GenerateContentRequest): Promise<GenerateContentResult> {
    this.lastRequest = request;
    return { response: this.generateResponse };
  }

  async generateContentStream(
    request: GenerateContentRequest
  ): Promise<GenerateContentStreamResult> {
    this.lastStreamRequest = request;
    const finalResponse = this.streamFinal ?? this.generateResponse;

    async function* iterator(chunks: EnhancedGenerateContentResponse[]) {
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    return {
      stream: iterator(this.streamChunks),
      response: Promise.resolve(finalResponse),
    };
  }
}

class MockClient implements GenerativeAIClient {
  constructor(private readonly model: MockGenerativeModel) {}
  getGenerativeModel(): GenerativeModelLike {
    return this.model;
  }
}

describe('GoogleAIBridge', () => {
  let config: GoogleAIConfig;
  let prompt: LlmBridgePrompt;
  let model: MockGenerativeModel;
  let bridge: GoogleAIBridge;

  beforeEach(() => {
    config = {
      apiKey: 'test-key',
      model: GoogleModelEnum.GEMINI_1_5_FLASH,
      temperature: 0.2,
      topP: 0.8,
      topK: 32,
      maxOutputTokens: 4_096,
      candidateCount: 2,
      stopSequences: ['END'],
      responseMimeType: 'application/json',
      responseSchema: { type: 'object', properties: {} },
      presencePenalty: 0.1,
      frequencyPenalty: 0.2,
      safetySettings: [{ category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' }],
    };

    prompt = {
      messages: [
        {
          role: 'system',
          content: [{ contentType: 'text', value: 'You are helpful.' }],
        },
        {
          role: 'user',
          content: [{ contentType: 'text', value: 'Hello Gemini' }],
        },
      ],
    };

    model = new MockGenerativeModel();
    bridge = new GoogleAIBridge(new MockClient(model), config);
  });

  it('invoke 시 설정과 옵션을 병합하여 요청을 생성해야 함', async () => {
    model.generateResponse = createResponse({
      text: 'response text',
      usage: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 32 },
    });

    const result = await bridge.invoke(prompt, {
      temperature: 0.5,
      maxTokens: 1_024,
      stopSequence: ['STOP'],
      tools: [
        {
          name: 'lookup',
          description: 'Lookup tool',
          parameters: { type: 'object', properties: { query: { type: 'string' } } },
        },
      ],
    });

    expect(model.lastRequest).toBeDefined();
    const request = model.lastRequest!;

    expect(request.systemInstruction).toBe('You are helpful.');
    expect(request.contents).toHaveLength(1);
    expect(request.contents?.[0].role).toBe('user');
    expect(request.contents?.[0].parts?.[0]).toEqual({ text: 'Hello Gemini' });

    expect(request.generationConfig).toEqual(
      expect.objectContaining({
        temperature: 0.5,
        topP: 0.8,
        topK: 32,
        maxOutputTokens: 1_024,
        stopSequences: ['STOP'],
        candidateCount: 2,
        responseMimeType: 'application/json',
        presencePenalty: 0.1,
        frequencyPenalty: 0.2,
      })
    );
    expect(request.generationConfig?.responseSchema).toEqual({
      type: 'object',
      properties: {},
    });

    expect(request.safetySettings).toEqual(config.safetySettings);
    const tool = request.tools?.[0];
    if (!tool || !('functionDeclarations' in tool)) {
      throw new Error('functionDeclarations tool expected');
    }
    expect(tool.functionDeclarations?.[0]?.name).toBe('lookup');
    expect(request.toolConfig?.functionCallingConfig.mode).toBe(FunctionCallingMode.AUTO);

    expect(result.content).toEqual({ contentType: 'text', value: 'response text' });
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 20, totalTokens: 32 });
    expect(result.toolCalls).toEqual([]);
  });

  it('tool 메시지를 functionResponse 파트로 변환해야 함', async () => {
    prompt.messages.push({
      role: 'tool',
      name: 'weather',
      toolCallId: 'call-1',
      content: [{ contentType: 'text', value: '{"ok":true}' }],
    });

    await bridge.invoke(prompt);
    const request = model.lastRequest!;

    const functionEntry = request.contents?.find(content => content.role === 'function');
    expect(functionEntry).toBeDefined();
    expect(functionEntry?.parts?.[0]).toEqual({
      functionResponse: {
        name: 'weather',
        response: { ok: true },
      },
    });
  });

  it('모델에서 반환한 function call 정보를 toolCalls로 변환해야 함', async () => {
    model.generateResponse = createResponse({
      text: 'done',
      functionCalls: [
        { name: 'weather', args: { city: 'Seoul' } },
        { name: 'lookup', args: { query: 'gemini' } },
      ],
    });

    const result = await bridge.invoke(prompt);
    expect(result.toolCalls).toHaveLength(2);
    expect(result.toolCalls?.[0]).toEqual({
      toolCallId: JSON.stringify({ name: 'weather', args: { city: 'Seoul' } }),
      name: 'weather',
      arguments: { city: 'Seoul' },
    });
    expect(result.toolCalls?.[1].name).toBe('lookup');
  });

  it('안전 필터에 의해 차단되면 에러를 발생시켜야 함', async () => {
    model.generateResponse = createResponse({
      text: '',
      promptFeedback: { blockReason: BlockReason.SAFETY, safetyRatings: [] },
    });

    await expect(bridge.invoke(prompt)).rejects.toThrow('Gemini request blocked');
  });

  it('스트리밍 응답에서 증분 텍스트와 사용량, 도구 호출을 순차적으로 전달해야 함', async () => {
    model.streamChunks = [
      createResponse({ text: 'Hel' }),
      createResponse({
        text: 'Hello',
        functionCalls: [{ name: 'lookup', args: { q: 1 } }],
      }),
    ];
    model.streamFinal = createResponse({
      text: 'Hello world',
      usage: { promptTokenCount: 3, candidatesTokenCount: 5, totalTokenCount: 9 },
      functionCalls: [{ name: 'lookup', args: { q: 1 } }],
    });

    const responses: LlmBridgeResponse[] = [];

    for await (const chunk of bridge.invokeStream(prompt)) {
      responses.push(chunk);
    }

    expect(responses).toHaveLength(5);
    expect(responses[0].content).toEqual({ contentType: 'text', value: 'Hel' });
    expect(responses[1].content).toEqual({ contentType: 'text', value: 'lo' });
    expect(responses[2].toolCalls).toEqual([
      {
        toolCallId: JSON.stringify({ name: 'lookup', args: { q: 1 } }),
        name: 'lookup',
        arguments: { q: 1 },
      },
    ]);
    expect(responses[3].content).toEqual({ contentType: 'text', value: ' world' });
    expect(responses[4].usage).toEqual({ promptTokens: 3, completionTokens: 5, totalTokens: 9 });
  });
});

function createResponse(
  options: {
    text?: string;
    functionCalls?: FunctionCall[];
    usage?: UsageMetadata;
    promptFeedback?: EnhancedGenerateContentResponse['promptFeedback'];
  } = {}
): EnhancedGenerateContentResponse {
  const { text = '', functionCalls, usage, promptFeedback } = options;

  return {
    candidates: [
      {
        index: 0,
        content: {
          role: 'model',
          parts: text ? [{ text }] : [],
        },
      },
    ],
    usageMetadata: usage,
    promptFeedback,
    text: () => text,
    functionCall: () => functionCalls?.[0],
    functionCalls: () => (functionCalls && functionCalls.length > 0 ? functionCalls : undefined),
  };
}
