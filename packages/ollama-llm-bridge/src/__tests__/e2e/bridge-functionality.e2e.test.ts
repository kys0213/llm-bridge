/**
 * OllamaBridge 핵심 기능 E2E 테스트
 * Phase 1: 기본 기능 테스트
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { OllamaBridge } from '../../bridge/ollama-bridge';
import { LlmBridgeResponse, LlmMetadata } from 'llm-bridge-spec';
import {
  setupE2ETest,
  createTestBridge,
  createSimplePrompt,
  createMultiTurnPrompt,
  measureExecutionTime,
  TEST_CONFIG,
} from './test-utils';

describe('OllamaBridge E2E Tests', () => {
  let bridge: OllamaBridge;

  beforeAll(async () => {
    try {
      await setupE2ETest();
    } catch (error) {
      if (error instanceof Error && error.message === 'E2E_TEST_SKIP') {
        console.warn('Skipping OllamaBridge E2E tests due to environment issues');
        return;
      }
      throw error;
    }
  });

  beforeEach(() => {
    bridge = createTestBridge();
  });

  describe('invoke() - 기본 LLM 호출', () => {
    it(
      'should generate text response successfully',
      async () => {
        const prompt = createSimplePrompt('Say hello in one word.');

        const response: LlmBridgeResponse = await bridge.invoke(prompt);

        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
        expect(response.content.contentType).toBe('text');
        expect(typeof response.content.value).toBe('string');
        expect(response.content.value.length).toBeGreaterThan(0);
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should handle different InvokeOptions',
      async () => {
        const prompt = createSimplePrompt('Count from 1 to 3.');

        const response = await bridge.invoke(prompt, {
          temperature: 0.1,
          maxTokens: 50,
        });

        expect(response).toBeDefined();
        expect(response.content.contentType).toBe('text');
        expect(typeof response.content.value).toBe('string');
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should handle multi-turn conversation',
      async () => {
        const prompt = createMultiTurnPrompt();

        const response = await bridge.invoke(prompt);

        expect(response).toBeDefined();
        expect(response.content.contentType).toBe('text');
        expect(typeof response.content.value).toBe('string');
        // 이름을 기억하고 있는지 확인 (Alice 관련 내용이 포함되어야 함)
        expect(response.content.value.toLowerCase()).toMatch(/alice|name/);
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should include usage information when available',
      async () => {
        const prompt = createSimplePrompt('Hello');

        const response = await bridge.invoke(prompt);

        expect(response).toBeDefined();
        if (response.usage) {
          expect(response.usage.promptTokens).toBeGreaterThan(0);
          expect(response.usage.completionTokens).toBeGreaterThan(0);
          expect(response.usage.totalTokens).toBeGreaterThan(0);
          expect(response.usage.totalTokens).toBe(
            response.usage.promptTokens + response.usage.completionTokens
          );
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should measure response time',
      async () => {
        const prompt = createSimplePrompt('Say hi.');

        const { result, elapsedMs } = await measureExecutionTime(async () => {
          return bridge.invoke(prompt);
        });

        expect(result).toBeDefined();
        expect(elapsedMs).toBeGreaterThan(0);
        expect(elapsedMs).toBeLessThan(TEST_CONFIG.TEST_TIMEOUT);

        console.log(`Response time: ${elapsedMs}ms`);
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('getMetadata() - 메타데이터 조회', () => {
    it('should return valid metadata', async () => {
      const metadata: LlmMetadata = await bridge.getMetadata();

      expect(metadata).toBeDefined();
      expect(metadata.name).toBeDefined();
      expect(typeof metadata.name).toBe('string');
      expect(metadata.version).toBeDefined();
      expect(metadata.provider).toBeDefined();
      expect(metadata.model).toBeDefined();
      expect(metadata.model).toBe(TEST_CONFIG.TEST_MODEL);
    });

    it('should return consistent metadata across calls', async () => {
      const metadata1 = await bridge.getMetadata();
      const metadata2 = await bridge.getMetadata();

      expect(metadata1).toEqual(metadata2);
    });

    it('should include model-specific information', async () => {
      const metadata = await bridge.getMetadata();

      expect(metadata.provider).toBe('ollama');
      expect(metadata.model).toBe(TEST_CONFIG.TEST_MODEL);

      // 모델명에 따른 메타데이터 검증
      if (metadata.model === 'llama3.2') {
        expect(metadata.name).toBe('Llama');
      } else if (metadata.model === 'gemma3n') {
        expect(metadata.name).toBe('Gemma');
      }

      console.log(
        `Model metadata - Name: ${String(metadata.name)}, Model: ${String(metadata.model)}, Provider: ${String(metadata.provider)}`
      );
    });
  });

  describe('getSupportedModels() - 지원 모델 목록', () => {
    it('should return list of supported models', () => {
      const supportedModels = bridge.getSupportedModels();

      expect(supportedModels).toBeDefined();
      expect(Array.isArray(supportedModels)).toBe(true);
      expect(supportedModels.length).toBeGreaterThan(0);
    });

    it('should include available local models', () => {
      const supportedModels = bridge.getSupportedModels();

      // 로컬에 설치된 모델들이 지원 목록에 포함되어 있는지 확인
      expect(supportedModels).toContain('llama3.2');
      expect(supportedModels).toContain('gemma3n');

      console.log('Available supported models:', supportedModels);
    });

    it('should return consistent model list', () => {
      const models1 = bridge.getSupportedModels();
      const models2 = bridge.getSupportedModels();

      expect(models1).toEqual(models2);
    });
  });

  describe('getCurrentModel() - 현재 모델 조회', () => {
    it('should return current model ID', () => {
      const currentModel = bridge.getCurrentModel();

      expect(currentModel).toBeDefined();
      expect(typeof currentModel).toBe('string');
      expect(currentModel).toBe(TEST_CONFIG.TEST_MODEL);
    });

    it('should match configuration model', () => {
      const testBridge = createTestBridge({ model: 'llama3.2' });
      const currentModel = testBridge.getCurrentModel();

      expect(currentModel).toBe('llama3.2');
    });
  });

  describe('getDefaultConfig() - 기본 설정 조회', () => {
    it('should return default configuration', () => {
      const defaultConfig = bridge.getDefaultConfig();

      expect(defaultConfig).toBeDefined();
      expect(typeof defaultConfig).toBe('object');
      expect(defaultConfig.model).toBeDefined();
      expect(defaultConfig.temperature).toBeDefined();
      expect(typeof defaultConfig.temperature).toBe('number');
    });

    it('should return model-specific defaults', () => {
      const defaultConfig = bridge.getDefaultConfig();

      expect(defaultConfig.model).toBe(TEST_CONFIG.TEST_MODEL);

      // 온도 값이 유효한 범위에 있는지 확인
      if (defaultConfig.temperature !== undefined) {
        expect(defaultConfig.temperature).toBeGreaterThanOrEqual(0);
        expect(defaultConfig.temperature).toBeLessThanOrEqual(2);
      }
    });

    it('should include prediction settings', () => {
      const defaultConfig = bridge.getDefaultConfig();

      expect(defaultConfig.num_predict).toBeDefined();
      expect(typeof defaultConfig.num_predict).toBe('number');
      expect(defaultConfig.num_predict).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests - 통합 테스트', () => {
    it(
      'should maintain state across multiple calls',
      async () => {
        // 첫 번째 호출
        const response1 = await bridge.invoke(createSimplePrompt('Hello'));
        expect(response1.content.contentType).toBe('text');

        // 메타데이터 호출
        const metadata = await bridge.getMetadata();
        expect(metadata.model).toBe(TEST_CONFIG.TEST_MODEL);

        // 두 번째 호출
        const response2 = await bridge.invoke(createSimplePrompt('Hi there'));
        expect(response2.content.contentType).toBe('text');

        // 상태가 유지되는지 확인
        expect(bridge.getCurrentModel()).toBe(TEST_CONFIG.TEST_MODEL);
      },
      TEST_CONFIG.TEST_TIMEOUT * 2
    );

    it(
      'should handle rapid successive calls',
      async () => {
        const promises = Array.from({ length: 3 }, (_, i) =>
          bridge.invoke(createSimplePrompt(`Message ${i + 1}`))
        );

        const responses = await Promise.all(promises);

        responses.forEach((response, _index) => {
          expect(response).toBeDefined();
          expect(response.content.contentType).toBe('text');
          expect(typeof response.content.value).toBe('string');
        });
      },
      TEST_CONFIG.TEST_TIMEOUT * 2
    );
  });
});
