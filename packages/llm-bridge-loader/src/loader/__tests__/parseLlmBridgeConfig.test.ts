import { describe, it, expect } from 'vitest';
import { parseLlmBridgeConfig } from '../parseLlmBridgeConfig';
import { LlmManifest } from '@agentos/llm-bridge-spec';

describe('parseLlmBridgeConfig', () => {
  it('should parse valid config according to schema', () => {
    // 테스트용 매니페스트 생성
    const manifest: LlmManifest = {
      schemaVersion: '1.0.0',
      name: 'Test LLM',
      language: 'typescript',
      entry: 'index.js',
      description: 'Test LLM Bridge',
      capabilities: {
        modalities: ['text'],
        supportsToolCall: true,
        supportsFunctionCall: true,
        supportsMultiTurn: true,
        supportsStreaming: true,
        supportsVision: true,
      },
      configSchema: {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description: 'API 키',
          },
          model: {
            type: 'string',
            description: '모델 이름',
            enum: ['gpt-3.5-turbo', 'gpt-4'],
          },
          temperature: {
            type: 'number',
            description: '온도',
            default: 0.7,
          },
          maxTokens: {
            type: 'integer',
            description: '최대 토큰 수',
            default: 1000,
          },
        },
        required: ['apiKey', 'model'],
      },
    };

    // 설정 파싱 함수 생성
    const schema = parseLlmBridgeConfig(manifest);

    // 유효한 설정 테스트
    const validConfig = {
      apiKey: 'test-api-key',
      model: 'gpt-3.5-turbo',
      temperature: 0.8,
      maxTokens: 2000,
    };

    // 유효한 설정은 예외를 발생시키지 않아야 함
    expect(() => schema.parse(validConfig)).not.toThrow();

    // 필수 필드가 없는 설정 테스트
    const invalidConfig1 = {
      model: 'gpt-3.5-turbo',
      temperature: 0.8,
    };

    // 필수 필드가 없는 설정은 예외를 발생시켜야 함
    expect(() => schema.parse(invalidConfig1)).toThrow();

    // 잘못된 열거형 값을 가진 설정 테스트
    const invalidConfig2 = {
      apiKey: 'test-api-key',
      model: 'invalid-model',
      temperature: 0.8,
    };

    // 잘못된 열거형 값을 가진 설정은 예외를 발생시켜야 함
    expect(() => schema.parse(invalidConfig2)).toThrow();

    // 잘못된 타입을 가진 설정 테스트
    const invalidConfig3 = {
      apiKey: 'test-api-key',
      model: 'gpt-3.5-turbo',
      temperature: '0.8', // 문자열이어야 하는데 숫자임
    };

    // 잘못된 타입을 가진 설정은 예외를 발생시켜야 함
    expect(() => schema.parse(invalidConfig3)).toThrow();
  });
});
