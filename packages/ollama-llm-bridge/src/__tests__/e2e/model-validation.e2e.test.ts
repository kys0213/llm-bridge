/**
 * OllamaBridge 모델 검증 E2E 테스트
 * Phase 3: 에러 처리 테스트 - ModelNotSupportedError
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { ModelNotSupportedError } from 'llm-bridge-spec';
import { OllamaBridge } from '../../bridge/ollama-bridge';

import { createOllamaBridge } from '../../factory/ollama-factory';
import {
  setupE2ETest,
  createTestBridge,
  createSimplePrompt,
  checkModelAvailability,
  TEST_CONFIG,
} from './test-utils';

describe('Model Validation E2E Tests', () => {
  let bridge: OllamaBridge;

  beforeAll(async () => {
    try {
      await setupE2ETest();
    } catch (error) {
      if (error instanceof Error && error.message === 'E2E_TEST_SKIP') {
        console.warn('Skipping Model Validation E2E tests due to environment issues');
        return;
      }
      throw error;
    }
  });

  beforeEach(() => {
    bridge = createTestBridge();
  });

  describe('ModelNotSupportedError - 지원하지 않는 모델', () => {
    it('should throw ModelNotSupportedError for OpenAI models', () => {
      const openAIModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'text-davinci-003', 'gpt-4o'];

      openAIModels.forEach(model => {
        expect(() => {
          createOllamaBridge({
            host: TEST_CONFIG.OLLAMA_HOST,
            model: model,
          });
        }).toThrow(ModelNotSupportedError);
      });
    });

    it('should throw ModelNotSupportedError for Anthropic models', () => {
      const anthropicModels = [
        'claude-3-opus',
        'claude-3-sonnet',
        'claude-3-haiku',
        'claude-2',
        'claude-instant',
      ];

      anthropicModels.forEach(model => {
        expect(() => {
          createOllamaBridge({
            host: TEST_CONFIG.OLLAMA_HOST,
            model: model,
          });
        }).toThrow(ModelNotSupportedError);
      });
    });

    it('should throw ModelNotSupportedError for Google models', () => {
      const googleModels = ['palm-2', 'gemini-pro', 'gemini-pro-vision', 'bard'];

      googleModels.forEach(model => {
        expect(() => {
          createOllamaBridge({
            host: TEST_CONFIG.OLLAMA_HOST,
            model: model,
          });
        }).toThrow(ModelNotSupportedError);
      });
    });

    it('should throw ModelNotSupportedError for completely unknown models', () => {
      const unknownModels = [
        'non-existent-model',
        'fake-model-123',
        'random-ai-model',
        'test-model-xyz',
        '',
      ];

      unknownModels.forEach(model => {
        expect(() => {
          createOllamaBridge({
            host: TEST_CONFIG.OLLAMA_HOST,
            model: model,
          });
        }).toThrow(ModelNotSupportedError);
      });
    });

    it('should include requested model name in error', () => {
      const unsupportedModel = 'gpt-4';

      try {
        createOllamaBridge({
          host: TEST_CONFIG.OLLAMA_HOST,
          model: unsupportedModel,
        });
        expect.fail('Expected ModelNotSupportedError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ModelNotSupportedError);
        const modelError = error as ModelNotSupportedError;

        expect(modelError.requestedModel).toBe(unsupportedModel);
        expect(modelError.message).toContain(unsupportedModel);

        console.log('Model error for gpt-4:', modelError.message);
      }
    });

    it('should include list of supported models in error', () => {
      try {
        createOllamaBridge({
          host: TEST_CONFIG.OLLAMA_HOST,
          model: 'claude-3',
        });
        expect.fail('Expected ModelNotSupportedError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ModelNotSupportedError);
        const modelError = error as ModelNotSupportedError;

        expect(modelError.message).toContain('Supported models:');
        expect(modelError.message).toContain('llama');
        expect(modelError.message).toContain('gemma');

        console.log('Supported models in error:', modelError.message);
      }
    });

    it('should handle runtime model switching to unsupported model', () => {
      expect(() => {
        bridge.setModel('gpt-4');
      }).toThrow(ModelNotSupportedError);

      expect(() => {
        bridge.setModel('claude-3');
      }).toThrow(ModelNotSupportedError);

      // 원래 모델이 유지되어야 함
      expect(bridge.getCurrentModel()).toBe(TEST_CONFIG.TEST_MODEL);
    });
  });

  describe('Supported Model Validation', () => {
    it('should accept all officially supported Llama models', () => {
      const llamaModels = ['llama3.2', 'llama3.1', 'llama3', 'llama2', 'llama'];

      llamaModels.forEach(model => {
        expect(() => {
          const testBridge = createOllamaBridge({
            host: TEST_CONFIG.OLLAMA_HOST,
            model: model,
          });
          expect(testBridge.getCurrentModel()).toBe(model);
        }).not.toThrow();
      });
    });

    it('should accept all officially supported Gemma models', () => {
      const gemmaModels = [
        'gemma3n:latest',
        'gemma3n:7b',
        'gemma3n:2b',
        'gemma2:latest',
        'gemma:latest',
      ];

      gemmaModels.forEach(model => {
        expect(() => {
          const testBridge = createOllamaBridge({
            host: TEST_CONFIG.OLLAMA_HOST,
            model: model,
          });
          expect(testBridge.getCurrentModel()).toBe(model);
        }).not.toThrow();
      });
    });

    it('should validate model format consistency', () => {
      const supportedModels = bridge.getSupportedModels();

      expect(supportedModels).toBeDefined();
      expect(Array.isArray(supportedModels)).toBe(true);
      expect(supportedModels.length).toBeGreaterThan(0);

      supportedModels.forEach(model => {
        expect(typeof model).toBe('string');
        expect(model.length).toBeGreaterThan(0);

        // 지원되는 모델로 브릿지 생성이 가능해야 함
        expect(() => {
          createOllamaBridge({
            host: TEST_CONFIG.OLLAMA_HOST,
            model: model,
          });
        }).not.toThrow();
      });
    });
  });

  describe('Model Availability vs Support', () => {
    it(
      'should distinguish between supported and available models',
      async () => {
        const supportedModels = bridge.getSupportedModels();

        for (const model of supportedModels.slice(0, 3)) {
          // 처음 3개만 테스트
          const isAvailable = await checkModelAvailability(model);

          // 지원되는 모델이지만 Ollama에 설치되지 않을 수 있음
          if (!isAvailable) {
            console.log(`Model ${model} is supported but not available locally`);

            // 브릿지 생성은 성공해야 함 (모델 지원 검증)
            expect(() => {
              createOllamaBridge({
                host: TEST_CONFIG.OLLAMA_HOST,
                model: model,
              });
            }).not.toThrow();

            // 하지만 실제 호출은 실패할 수 있음
            const testBridge = createOllamaBridge({
              host: TEST_CONFIG.OLLAMA_HOST,
              model: model,
            });

            try {
              await testBridge.invoke(createSimplePrompt('Hello'));
              console.log(`Model ${model} is both supported and available`);
            } catch (error) {
              console.log(`Model ${model} is supported but invoke failed:`, error);
              // 이는 예상된 상황 (모델이 다운로드되지 않음)
            }
          } else {
            console.log(`Model ${model} is both supported and available`);
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT * 3
    );

    it(
      'should handle model installation status in error messages',
      async () => {
        const supportedModels = bridge.getSupportedModels();
        const testModel = supportedModels.find(model => model !== TEST_CONFIG.TEST_MODEL);

        if (testModel) {
          const isAvailable = await checkModelAvailability(testModel);

          if (!isAvailable) {
            const testBridge = createOllamaBridge({
              host: TEST_CONFIG.OLLAMA_HOST,
              model: testModel,
            });

            try {
              await testBridge.invoke(createSimplePrompt('Hello'));
              expect.fail(`Expected error for unavailable model ${testModel}`);
            } catch (error) {
              // 에러 메시지에 모델 관련 정보가 있어야 함
              const errorMessage = (error as Error).message.toLowerCase();
              const hasModelInfo =
                errorMessage.includes('model') || errorMessage.includes(testModel.toLowerCase());

              expect(hasModelInfo).toBe(true);
              console.log(`Unavailable model error for ${testModel}:`, error);
            }
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('Model Name Variations', () => {
    it('should handle different model name formats', () => {
      const modelVariations = [
        // 유효한 변형들
        { model: 'llama3.2', shouldWork: true },
        { model: 'llama3.2:latest', shouldWork: true },
        { model: 'gemma3n:7b', shouldWork: true },
        { model: 'gemma3n:2b', shouldWork: true },

        // 무효한 변형들
        { model: 'llama3.2:invalid-tag', shouldWork: false },
        { model: 'gemma3n:999b', shouldWork: false },
        { model: 'llama3.2-invalid', shouldWork: false },
      ];

      modelVariations.forEach(({ model, shouldWork }) => {
        if (shouldWork) {
          expect(() => {
            createOllamaBridge({
              host: TEST_CONFIG.OLLAMA_HOST,
              model: model,
            });
          }).not.toThrow();
        } else {
          expect(() => {
            createOllamaBridge({
              host: TEST_CONFIG.OLLAMA_HOST,
              model: model,
            });
          }).toThrow(ModelNotSupportedError);
        }
      });
    });

    it('should handle case sensitivity in model names', () => {
      const caseSensitiveTests = [
        'LLAMA3.2',
        'Llama3.2',
        'llama3.2',
        'GEMMA3N:LATEST',
        'Gemma3n:Latest',
        'gemma3n:latest',
      ];

      caseSensitiveTests.forEach(model => {
        // 현재 구현에서 대소문자 처리 방식 확인
        try {
          const testBridge = createOllamaBridge({
            host: TEST_CONFIG.OLLAMA_HOST,
            model: model,
          });
          console.log(`Case variation accepted: ${model} -> ${testBridge.getCurrentModel()}`);
        } catch (error) {
          if (error instanceof ModelNotSupportedError) {
            console.log(`Case variation rejected: ${model}`);
          } else {
            throw error;
          }
        }
      });
    });
  });

  describe('Error Message Quality', () => {
    it('should provide helpful suggestions in error messages', () => {
      try {
        createOllamaBridge({
          host: TEST_CONFIG.OLLAMA_HOST,
          model: 'llama4', // 존재하지 않는 버전
        });
        expect.fail('Expected ModelNotSupportedError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ModelNotSupportedError);
        const modelError = error as ModelNotSupportedError;

        // 유사한 모델에 대한 제안이 있는지 확인
        expect(modelError.message).toContain('llama');
        expect(modelError.message).toContain('Supported models:');

        console.log('Helpful error message:', modelError.message);
      }
    });

    it('should provide context about model types', () => {
      try {
        createOllamaBridge({
          host: TEST_CONFIG.OLLAMA_HOST,
          model: 'gpt-4',
        });
        expect.fail('Expected ModelNotSupportedError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ModelNotSupportedError);
        const modelError = error as ModelNotSupportedError;

        // OpenAI 모델은 지원하지 않는다는 것을 명확히 해야 함
        expect(modelError.message).toContain('not supported');
        expect(modelError.requestedModel).toBe('gpt-4');

        console.log('Context-aware error message:', modelError.message);
      }
    });
  });
});
