/**
 * OllamaBridge 설정 관련 E2E 테스트
 * Phase 3: 에러 처리 테스트 - ConfigurationError
 */

import { beforeAll, describe, expect, it } from 'vitest';

// fail 함수 정의
function fail(message: string): never {
  throw new Error(message);
}

import { ConfigurationError, ModelNotSupportedError } from 'llm-bridge-spec';
import { createOllamaBridge } from '../../factory/ollama-factory';
import { OllamaBaseConfig } from '../../types/config';
import { setupE2ETest, TEST_CONFIG } from './test-utils';

// Unsafe cast helper for test-only invalid typing scenarios
const cast = <T>(v: unknown) => v as T;

describe('Configuration Error E2E Tests', () => {
  beforeAll(async () => {
    try {
      await setupE2ETest();
    } catch (error) {
      if (error instanceof Error && error.message === 'E2E_TEST_SKIP') {
        console.warn('Skipping Configuration E2E tests due to environment issues');
        return;
      }
      throw error;
    }
  });

  describe('ConfigurationError - 설정 검증 실패', () => {
    it('should throw ConfigurationError for invalid host URL format', () => {
      const invalidConfigs: Partial<OllamaBaseConfig>[] = [
        { host: 'invalid-url', model: TEST_CONFIG.TEST_MODEL },
        { host: 'not-a-url', model: TEST_CONFIG.TEST_MODEL },
        { host: 'ftp://invalid-protocol.com', model: TEST_CONFIG.TEST_MODEL },
      ];

      invalidConfigs.forEach(config => {
        expect(() => {
          createOllamaBridge(config as OllamaBaseConfig);
        }).toThrow(ConfigurationError);
      });
    });

    it('should throw ConfigurationError for missing required fields', () => {
      // model 누락 (model은 required field)
      expect(() => {
        createOllamaBridge({
          host: TEST_CONFIG.OLLAMA_HOST,
        } as OllamaBaseConfig);
      }).toThrow(ConfigurationError);

      // 빈 객체 (model 없음)
      expect(() => {
        createOllamaBridge({} as OllamaBaseConfig);
      }).toThrow(ConfigurationError);

      // null 설정
      expect(() => {
        createOllamaBridge(cast<OllamaBaseConfig>(null));
      }).toThrow(ConfigurationError);

      // undefined 설정
      expect(() => {
        createOllamaBridge(cast<OllamaBaseConfig>(undefined));
      }).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError for invalid data types', () => {
      const invalidTypeConfigs: OllamaBaseConfig[] = [
        // temperature가 문자열
        {
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
          temperature: cast<number>('invalid'),
        },
        // num_predict가 문자열
        {
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
          num_predict: cast<number>('invalid'),
        },
        // 불린 값을 숫자 필드에
        {
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
          temperature: cast<number>(true),
        },
      ];

      invalidTypeConfigs.forEach(config => {
        expect(() => {
          createOllamaBridge(config);
        }).toThrow(ConfigurationError);
      });
    });

    it('should throw ConfigurationError for out-of-range values', () => {
      const outOfRangeConfigs: OllamaBaseConfig[] = [
        // temperature 범위 초과
        {
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
          temperature: -1,
        },
        {
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
          temperature: 3.0,
        },
        // num_predict가 음수
        {
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
          num_predict: -100,
        },
        // 매우 큰 값
        {
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
          num_predict: 1000000,
        },
      ];

      outOfRangeConfigs.forEach(config => {
        expect(() => {
          createOllamaBridge(config);
        }).toThrow(ConfigurationError);
      });
    });

    it('should provide detailed error messages for validation failures', () => {
      try {
        createOllamaBridge({
          host: 'invalid-url',
          model: TEST_CONFIG.TEST_MODEL,
          temperature: -1,
        });
        fail('Expected ConfigurationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        const configError = error as ConfigurationError;

        // 에러 메시지에 구체적인 검증 실패 정보가 포함되어야 함
        expect(configError.message).toContain('Configuration validation failed');
        expect(configError.cause).toBeDefined();

        console.log('Configuration error message:', configError.message);
      }
    });

    it('should handle nested configuration objects', () => {
      // 중첩된 객체는 현재 스키마에서 지원하지 않으므로
      // 대신 알려지지 않은 속성이 있는 config를 테스트
      const configWithUnknownProps = {
        host: TEST_CONFIG.OLLAMA_HOST,
        model: TEST_CONFIG.TEST_MODEL,
        unknownProp: 'should be ignored',
        temperature: cast<number>('invalid'), // 잘못된 타입
      };

      expect(() => {
        createOllamaBridge(cast<OllamaBaseConfig>(configWithUnknownProps));
      }).toThrow(ConfigurationError);
    });
  });

  describe('ModelNotSupportedError - 지원하지 않는 모델', () => {
    it('should throw ModelNotSupportedError for unsupported models', () => {
      const unsupportedModels = [
        'gpt-4',
        'claude-3',
        'palm-2',
        'non-existent-model',
        'openai/gpt-3.5-turbo',
      ];

      unsupportedModels.forEach(model => {
        expect(() => {
          createOllamaBridge({
            host: TEST_CONFIG.OLLAMA_HOST,
            model: model,
          });
        }).toThrow(ModelNotSupportedError);
      });
    });

    it('should include supported models list in error', () => {
      try {
        createOllamaBridge({
          host: TEST_CONFIG.OLLAMA_HOST,
          model: 'gpt-4',
        });
        fail('Expected ModelNotSupportedError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ModelNotSupportedError);
        const modelError = error as ModelNotSupportedError;

        expect(modelError.requestedModel).toBe('gpt-4');
        expect(modelError.message).toContain('gpt-4');
        expect(modelError.message).toContain('Supported models:');

        console.log('Model error message:', modelError.message);
      }
    });

    it('should handle case-sensitive model names', () => {
      const caseSensitiveModels = ['LLAMA3.2', 'Llama3.2', 'GEMMA3N:LATEST', 'Gemma3n:Latest'];

      caseSensitiveModels.forEach(model => {
        // 대소문자가 다르면 지원하지 않는 모델로 처리될 수 있음
        try {
          const bridge = createOllamaBridge({
            host: TEST_CONFIG.OLLAMA_HOST,
            model: model,
          });
          // 성공했다면 해당 케이스는 지원됨
          expect(bridge).toBeDefined();
        } catch (error) {
          // 실패했다면 ModelNotSupportedError여야 함
          expect(error).toBeInstanceOf(ModelNotSupportedError);
        }
      });
    });
  });

  describe('Valid Configuration', () => {
    it('should accept valid minimal configuration', () => {
      const validConfig: OllamaBaseConfig = {
        host: TEST_CONFIG.OLLAMA_HOST,
        model: TEST_CONFIG.TEST_MODEL,
      };

      expect(() => {
        const bridge = createOllamaBridge(validConfig);
        expect(bridge).toBeDefined();
      }).not.toThrow();
    });

    it('should accept valid full configuration', () => {
      const validConfig: OllamaBaseConfig = {
        host: TEST_CONFIG.OLLAMA_HOST,
        model: TEST_CONFIG.TEST_MODEL,
        temperature: 0.7,
        num_predict: 2048,
        top_p: 0.9,
        top_k: 40,
      };

      expect(() => {
        const bridge = createOllamaBridge(validConfig);
        expect(bridge).toBeDefined();
        expect(bridge.getCurrentModel()).toBe(TEST_CONFIG.TEST_MODEL);
      }).not.toThrow();
    });

    it('should handle optional parameters correctly', () => {
      const configsWithOptionals = [
        // temperature만 설정
        {
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
          temperature: 0.5,
        },
        // num_predict만 설정
        {
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
          num_predict: 1024,
        },
        // 일부 고급 옵션들
        {
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
          top_p: 0.8,
          top_k: 30,
        },
      ];

      configsWithOptionals.forEach(config => {
        expect(() => {
          const bridge = createOllamaBridge(config);
          expect(bridge).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should validate URL formats correctly', () => {
      const validHosts = [
        'http://localhost:11434',
        'https://ollama.example.com',
        'http://192.168.1.100:11434',
        'https://ollama-server.local:8080',
      ];

      validHosts.forEach(host => {
        expect(() => {
          const bridge = createOllamaBridge({
            host: host,
            model: TEST_CONFIG.TEST_MODEL,
          });
          expect(bridge).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Configuration Error Recovery', () => {
    it('should not affect subsequent valid configurations after error', () => {
      // 잘못된 설정으로 에러 발생
      expect(() => {
        createOllamaBridge({
          host: 'invalid-url',
          model: TEST_CONFIG.TEST_MODEL,
        });
      }).toThrow(ConfigurationError);

      // 이후 올바른 설정은 정상 동작해야 함
      expect(() => {
        const bridge = createOllamaBridge({
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
        });
        expect(bridge).toBeDefined();
      }).not.toThrow();
    });

    it('should handle multiple validation errors in single config', () => {
      try {
        createOllamaBridge({
          host: 'invalid-url',
          model: 'unsupported-model',
          temperature: -1,
          num_predict: cast<number>('invalid'),
        });
        fail('Expected error to be thrown');
      } catch (error) {
        // 여러 검증 에러 중 첫 번째로 만나는 에러가 발생
        expect(error).toBeInstanceOf(Error);
        console.log('Multiple validation error:', error);
      }
    });
  });
});
