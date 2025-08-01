/**
 * OllamaBridge 모델 전환 기능 E2E 테스트
 * Phase 2: 고급 기능 테스트
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { OllamaBridge } from '../../bridge/ollama-bridge';
import { ModelNotSupportedError } from 'llm-bridge-spec';
import {
  setupE2ETest,
  createTestBridge,
  createSimplePrompt,
  checkModelAvailability,
  getAlternativeModel,
  TEST_CONFIG,
} from './test-utils';

describe('OllamaBridge Model Switching E2E Tests', () => {
  let bridge: OllamaBridge;

  beforeAll(async () => {
    try {
      await setupE2ETest();
    } catch (error) {
      if (error instanceof Error && error.message === 'E2E_TEST_SKIP') {
        console.warn('Skipping Model Switching E2E tests due to environment issues');
        return;
      }
      throw error;
    }
  });

  beforeEach(() => {
    bridge = createTestBridge();
  });

  describe('setModel() - 모델 변경', () => {
    it(
      'should change model successfully',
      async () => {
        const initialModel = bridge.getCurrentModel();
        expect(initialModel).toBe(TEST_CONFIG.TEST_MODEL);

        // 대체 모델로 변경 시도 (gemma3n:latest)
        const alternativeModel = getAlternativeModel(initialModel);

        if (alternativeModel) {
          // 모델 가용성 확인
          const isAvailable = await checkModelAvailability(alternativeModel);

          if (isAvailable) {
            bridge.setModel(alternativeModel);

            const newModel = bridge.getCurrentModel();
            expect(newModel).toBe(alternativeModel);
            expect(newModel).not.toBe(initialModel);

            // 변경된 모델로 실제 호출 테스트
            const response = await bridge.invoke(createSimplePrompt('Hello'));
            expect(response.content.contentType).toBe('text');
            expect(typeof response.content.value).toBe('string');

            console.log(`Successfully switched from ${initialModel} to ${alternativeModel}`);
          } else {
            console.warn(
              `Alternative model ${alternativeModel} not available, skipping model switch test`
            );
          }
        } else {
          console.warn('No alternative model found for switching test');
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it('should throw error for unsupported model', () => {
      expect(() => {
        bridge.setModel('gpt-4');
      }).toThrow(ModelNotSupportedError);

      expect(() => {
        bridge.setModel('claude-3');
      }).toThrow(ModelNotSupportedError);

      expect(() => {
        bridge.setModel('non-existent-model');
      }).toThrow(ModelNotSupportedError);
    });

    it('should maintain original model after failed switch', () => {
      const originalModel = bridge.getCurrentModel();

      try {
        bridge.setModel('invalid-model');
      } catch (error) {
        expect(error).toBeInstanceOf(ModelNotSupportedError);
      }

      // 원래 모델이 유지되어야 함
      expect(bridge.getCurrentModel()).toBe(originalModel);
    });

    it(
      'should update metadata after model change',
      async () => {
        const initialMetadata = await bridge.getMetadata();

        const supportedModels = bridge.getSupportedModels();
        const alternativeModel = supportedModels.find(model => model !== initialMetadata.model);

        if (alternativeModel) {
          const isAvailable = await checkModelAvailability(alternativeModel);

          if (isAvailable) {
            bridge.setModel(alternativeModel);

            const newMetadata = await bridge.getMetadata();
            expect(newMetadata.model).toBe(alternativeModel);
            expect(newMetadata.model).not.toBe(initialMetadata.model);

            // 다른 메타데이터도 업데이트되었는지 확인
            if (alternativeModel.includes('llama') && initialMetadata.model.includes('gemma')) {
              expect(newMetadata.name).toBe('Llama');
            } else if (
              alternativeModel.includes('gemma') &&
              initialMetadata.model.includes('llama')
            ) {
              expect(newMetadata.name).toBe('Gemma');
            }
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('getCurrentModel() - 현재 모델 조회', () => {
    it('should return current active model', () => {
      const currentModel = bridge.getCurrentModel();
      expect(typeof currentModel).toBe('string');
      expect(currentModel.length).toBeGreaterThan(0);
    });

    it('should reflect model changes', () => {
      const initialModel = bridge.getCurrentModel();

      const supportedModels = bridge.getSupportedModels();
      const testModel = supportedModels.find(model => model !== initialModel) || initialModel;

      if (testModel !== initialModel) {
        bridge.setModel(testModel);
        expect(bridge.getCurrentModel()).toBe(testModel);
      }
    });

    it('should be consistent across multiple calls', () => {
      const model1 = bridge.getCurrentModel();
      const model2 = bridge.getCurrentModel();
      const model3 = bridge.getCurrentModel();

      expect(model1).toBe(model2);
      expect(model2).toBe(model3);
    });
  });

  describe('getDefaultConfig() - 기본 설정 조회', () => {
    it('should return model-specific default config', () => {
      const defaultConfig = bridge.getDefaultConfig();

      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.model).toBe(bridge.getCurrentModel());
      expect(typeof defaultConfig.temperature).toBe('number');
      expect(typeof defaultConfig.num_predict).toBe('number');
    });

    it(
      'should update config after model change',
      async () => {
        const initialConfig = bridge.getDefaultConfig();

        const supportedModels = bridge.getSupportedModels();
        const alternativeModel = supportedModels.find(model => model !== initialConfig.model);

        if (alternativeModel) {
          const isAvailable = await checkModelAvailability(alternativeModel);

          if (isAvailable) {
            bridge.setModel(alternativeModel);

            const newConfig = bridge.getDefaultConfig();
            expect(newConfig.model).toBe(alternativeModel);
            expect(newConfig.model).not.toBe(initialConfig.model);

            // 모델별로 다른 기본값을 가질 수 있음
            expect(typeof newConfig.temperature).toBe('number');
            expect(typeof newConfig.num_predict).toBe('number');
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it('should provide valid configuration values', () => {
      const config = bridge.getDefaultConfig();

      // 온도 값 검증
      if (config.temperature !== undefined) {
        expect(config.temperature).toBeGreaterThanOrEqual(0);
        expect(config.temperature).toBeLessThanOrEqual(2);
      }

      // 예측 토큰 수 검증
      if (config.num_predict !== undefined) {
        expect(config.num_predict).toBeGreaterThan(0);
        expect(config.num_predict).toBeLessThanOrEqual(4096);
      }
    });
  });

  describe('Model Switching Scenarios', () => {
    it(
      'should handle Llama to Gemma switch',
      async () => {
        const llamaModel = 'llama3.2';
        const gemmaModel = 'gemma3n';

        const llamaAvailable = await checkModelAvailability(llamaModel);
        const gemmaAvailable = await checkModelAvailability(gemmaModel);

        if (llamaAvailable && gemmaAvailable) {
          // Llama로 설정
          bridge.setModel(llamaModel);
          expect(bridge.getCurrentModel()).toBe(llamaModel);

          const llamaResponse = await bridge.invoke(createSimplePrompt('What is your name?'));
          expect(llamaResponse.content.contentType).toBe('text');

          // Gemma로 변경
          bridge.setModel(gemmaModel);
          expect(bridge.getCurrentModel()).toBe(gemmaModel);

          const gemmaResponse = await bridge.invoke(createSimplePrompt('What is your name?'));
          expect(gemmaResponse.content.contentType).toBe('text');

          console.log(`Llama (${llamaModel}) response: ${String(llamaResponse.content.value)}`);
          console.log(`Gemma (${gemmaModel}) response: ${String(gemmaResponse.content.value)}`);
        } else {
          console.warn(
            `Skipping model switch test - Llama available: ${llamaAvailable}, Gemma available: ${gemmaAvailable}`
          );
        }
      },
      TEST_CONFIG.TEST_TIMEOUT * 2
    );

    it(
      'should maintain conversation context after model switch',
      async () => {
        const currentModel = bridge.getCurrentModel();
        const alternativeModel = getAlternativeModel(currentModel);

        if (alternativeModel) {
          const isAvailable = await checkModelAvailability(alternativeModel);

          if (isAvailable) {
            // 첫 번째 모델로 대화 시작
            const response1 = await bridge.invoke(createSimplePrompt('My name is Alice.'));
            expect(response1.content.contentType).toBe('text');

            // 모델 변경
            bridge.setModel(alternativeModel);

            // 새 모델에서도 독립적으로 동작해야 함
            const response2 = await bridge.invoke(createSimplePrompt('What is my name?'));
            expect(response2.content.contentType).toBe('text');

            // 새 모델은 이전 대화를 모르므로 Alice를 모를 수 있음
            console.log(
              `Response after model switch from ${currentModel} to ${alternativeModel}: ${String(response2.content.value)}`
            );
          } else {
            console.warn(`Alternative model ${alternativeModel} not available for context test`);
          }
        } else {
          console.warn('No alternative model available for context test');
        }
      },
      TEST_CONFIG.TEST_TIMEOUT * 2
    );

    it(
      'should handle rapid model switches',
      async () => {
        const availableModels = TEST_CONFIG.AVAILABLE_MODELS;

        // 두 모델 모두 사용 가능한지 확인
        const modelAvailability = await Promise.all(
          availableModels.map(model => checkModelAvailability(model))
        );

        const usableModels = availableModels.filter((_, index) => modelAvailability[index]);

        if (usableModels.length >= 2) {
          // 빠른 모델 전환 (2개 모델 사이에서 3번 전환)
          for (let i = 0; i < 3; i++) {
            const modelIndex = i % usableModels.length;
            const testModel = usableModels[modelIndex];

            bridge.setModel(testModel);
            expect(bridge.getCurrentModel()).toBe(testModel);

            // 각 모델에서 간단한 호출
            const response = await bridge.invoke(createSimplePrompt(`Test ${i + 1}`));
            expect(response.content.contentType).toBe('text');

            console.log(`Switch ${i + 1}: Using ${testModel}`);
          }
        } else {
          console.warn(
            `Not enough models available for rapid switch test. Available: ${usableModels.length}`
          );
        }
      },
      TEST_CONFIG.TEST_TIMEOUT * 2
    );
  });
});
