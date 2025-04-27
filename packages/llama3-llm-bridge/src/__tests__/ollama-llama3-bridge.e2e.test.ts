import { describe, beforeAll, it, expect } from 'vitest';
import { LlmBridgePrompt, InvokeOption, StringContent } from '@agentos/llm-bridge-spec';
import { OllamaLlama3Bridge } from '../bridge/ollama-llama3-bridge';

describe('OllamaLlama3Bridge E2E Tests', () => {
  let bridge: OllamaLlama3Bridge;

  beforeAll(() => {
    bridge = new OllamaLlama3Bridge();
  });

  it('should generate text', async () => {
    const response = await bridge.invoke({
      messages: [
        {
          role: 'user',
          content: {
            contentType: 'text',
            value: 'Hello, how are you?',
          },
        },
      ],
    });
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(response.content.contentType).toBe('text');
    expect(typeof response.content.value).toBe('string');
    expect((response.content.value as string).length).toBeGreaterThan(0);
  });

  it('invoke 메서드가 정상적으로 동작해야 함', async () => {
    // 테스트용 프롬프트 생성
    const prompt: LlmBridgePrompt = {
      messages: [
        {
          role: 'user',
          content: {
            contentType: 'text',
            value: '안녕하세요, 간단한 테스트입니다.',
          },
        },
      ],
    };

    // 기본 옵션 설정
    const option: InvokeOption = {
      temperature: 0.7,
      maxTokens: 100,
    };

    // invoke 메서드 호출
    const response = await bridge.invoke(prompt, option);

    // 응답 검증
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(response.content.contentType).toBe('text');
    expect(typeof response.content.value).toBe('string');
    expect((response.content.value as string).length).toBeGreaterThan(0);
  }, 30000); // 타임아웃 30초 설정

  it('invokeStream 메서드가 정상적으로 동작해야 함', async () => {
    // 테스트용 프롬프트 생성
    const prompt: LlmBridgePrompt = {
      messages: [
        {
          role: 'user',
          content: {
            contentType: 'text',
            value: '스트리밍 테스트입니다. 짧은 응답을 주세요.',
          } as StringContent,
        },
      ],
    };

    // 기본 옵션 설정
    const option: InvokeOption = {
      temperature: 0.7,
      maxTokens: 50,
    };

    // 스트리밍 응답 수집
    const responses: string[] = [];
    for await (const chunk of bridge.invokeStream(prompt, option)) {
      expect(chunk.content.contentType).toBe('text');
      responses.push(chunk.content.value as string);
    }

    // 응답 검증
    expect(responses.length).toBeGreaterThan(0);
    const fullResponse = responses.join('');
    expect(fullResponse.length).toBeGreaterThan(0);
  }, 30000); // 타임아웃 30초 설정

  it('getMetadata 메서드가 정상적으로 동작해야 함', async () => {
    const metadata = await bridge.getMetadata();

    expect(metadata).toBeDefined();
    expect(metadata.name).toBe('Llama');
    expect(metadata.model).toBe('llama3.2');
    expect(metadata.contextWindow).toBeGreaterThan(0);
    expect(metadata.maxTokens).toBeGreaterThan(0);
  });
});
