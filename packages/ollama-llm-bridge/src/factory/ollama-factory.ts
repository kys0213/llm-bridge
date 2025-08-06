import { Ollama } from 'ollama';
import { OllamaBaseConfig, OllamaBaseConfigSchema } from '../types/config';
import { OllamaBridge } from '../bridge/ollama-bridge';
import { handleFactoryError, validateModel } from '../utils/error-handler';

/**
 * Ollama 브릿지를 생성하는 팩토리 함수
 */
export function createOllamaBridge(config: OllamaBaseConfig): OllamaBridge {
  try {
    // null 또는 undefined 체크
    if (!config) {
      throw new Error('Configuration is required');
    }

    // 설정 검증
    const validatedConfig = OllamaBaseConfigSchema.parse(config);

    // 모델 검증
    validateModel(validatedConfig.model || 'llama3.2');

    // Ollama 클라이언트 생성
    const client = new Ollama({
      host: validatedConfig.host,
    });

    // 브릿지 생성
    return new OllamaBridge(client, validatedConfig);
  } catch (error) {
    handleFactoryError(error);
  }
}

/**
 * 기본 설정으로 Ollama 브릿지 생성 (Llama 3.2)
 */
export function createDefaultOllamaBridge(overrides?: Partial<OllamaBaseConfig>): OllamaBridge {
  const defaultConfig: OllamaBaseConfig = {
    host: 'http://localhost:11434',
    model: 'llama3.2',
    temperature: 0.7,
    num_predict: 4096,
    ...overrides,
  };

  return createOllamaBridge(defaultConfig);
}

/**
 * Llama 모델용 편의 팩토리 함수
 */
export function createLlamaBridge(config?: Partial<OllamaBaseConfig>): OllamaBridge {
  const llamaConfig: OllamaBaseConfig = {
    host: 'http://localhost:11434',
    model: 'llama3.2',
    temperature: 0.7,
    num_predict: 4096,
    ...config,
  };

  return createOllamaBridge(llamaConfig);
}

/**
 * Gemma 모델용 편의 팩토리 함수
 */
export function createGemmaBridge(config?: Partial<OllamaBaseConfig>): OllamaBridge {
  const gemmaConfig: OllamaBaseConfig = {
    host: 'http://localhost:11434',
    model: 'gemma3n:latest',
    temperature: 0.7,
    num_predict: 2048,
    ...config,
  };

  return createOllamaBridge(gemmaConfig);
}

/**
 * GPT-OSS 모델용 편의 팩토리 함수
 */
export function createGptOssBridge(config?: Partial<OllamaBaseConfig>): OllamaBridge {
  const gptOssConfig: OllamaBaseConfig = {
    host: 'http://localhost:11434',
    model: 'gpt-oss-20:b',
    temperature: 0.7,
    num_predict: 4096,
    ...config,
  };

  return createOllamaBridge(gptOssConfig);
}
