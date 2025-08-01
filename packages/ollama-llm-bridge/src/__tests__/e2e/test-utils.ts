/**
 * E2E 테스트를 위한 유틸리티 함수들
 */

import { Ollama } from 'ollama';
import { OllamaBridge } from '../../bridge/ollama-bridge';
import { createOllamaBridge } from '../../factory/ollama-factory';
import { OllamaBaseConfig } from '../../types/config';
import { isWrappedError, isConfigurationErrorWithCause } from '../../utils/error-handler';

// 테스트 환경 변수
export const TEST_CONFIG = {
  OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
  TEST_MODEL: process.env.OLLAMA_TEST_MODEL || 'llama3.2',
  ALTERNATIVE_MODEL: 'gemma3n',
  TEST_TIMEOUT: parseInt(process.env.TEST_TIMEOUT || '30000'),
  SKIP_E2E_TESTS: process.env.SKIP_E2E_TESTS === 'true',
  // 로컬에 설치된 모델 목록 (bridge에서 지원하는 모델명 형식)
  AVAILABLE_MODELS: ['llama3.2', 'gemma3n'],
};

/**
 * E2E 테스트 스킵 여부 확인
 */
export function shouldSkipE2ETests(): boolean {
  return TEST_CONFIG.SKIP_E2E_TESTS;
}

/**
 * Ollama 서버 연결 상태 확인
 */
export async function checkOllamaConnection(): Promise<boolean> {
  try {
    const client = new Ollama({ host: TEST_CONFIG.OLLAMA_HOST });
    await client.list();
    return true;
  } catch (error) {
    console.warn(`Ollama server connection failed: ${String(error)}`);
    return false;
  }
}

/**
 * 테스트용 모델이 사용 가능한지 확인
 * Bridge 모델명을 Ollama 모델명으로 매핑하여 확인
 */
export async function checkModelAvailability(
  modelName: string = TEST_CONFIG.TEST_MODEL
): Promise<boolean> {
  try {
    const client = new Ollama({ host: TEST_CONFIG.OLLAMA_HOST });
    const models = await client.list();

    // Bridge 모델명을 Ollama 모델명으로 매핑
    const ollamaModelName = modelName.includes(':') ? modelName : `${modelName}:latest`;

    return models.models.some(
      model => model.name === ollamaModelName || model.name.startsWith(modelName + ':')
    );
  } catch (error) {
    console.warn(`Model availability check failed: ${String(error)}`);
    return false;
  }
}

/**
 * 사용 가능한 모델 목록 중에서 선택
 */
export function getAvailableTestModels(): string[] {
  return TEST_CONFIG.AVAILABLE_MODELS;
}

/**
 * 대체 모델 조회 (기본 모델이 아닌 다른 모델)
 */
export function getAlternativeModel(currentModel: string = TEST_CONFIG.TEST_MODEL): string | null {
  const availableModels = getAvailableTestModels();
  return availableModels.find(model => model !== currentModel) || null;
}

/**
 * 테스트용 OllamaBridge 인스턴스 생성
 */
export function createTestBridge(config: Partial<OllamaBaseConfig> = {}): OllamaBridge {
  const defaultConfig: OllamaBaseConfig = {
    host: TEST_CONFIG.OLLAMA_HOST,
    model: TEST_CONFIG.TEST_MODEL,
    temperature: 0.7,
    num_predict: 100, // 테스트용으로 짧게 설정
    ...config,
  };

  return createOllamaBridge(defaultConfig);
}

/**
 * 테스트 환경 검증
 */
export async function validateTestEnvironment(): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // E2E 테스트 스킵 여부 확인
  if (shouldSkipE2ETests()) {
    return {
      isValid: false,
      errors: ['E2E tests are configured to be skipped (SKIP_E2E_TESTS=true)'],
    };
  }

  // Ollama 서버 연결 확인
  const isConnected = await checkOllamaConnection();
  if (!isConnected) {
    errors.push(`Ollama server is not accessible at ${TEST_CONFIG.OLLAMA_HOST}`);
  }

  // 테스트 모델 가용성 확인
  if (isConnected) {
    const isModelAvailable = await checkModelAvailability();
    if (!isModelAvailable) {
      errors.push(`Test model '${TEST_CONFIG.TEST_MODEL}' is not available`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 테스트 전 환경 검증 및 스킵 처리
 */
export async function setupE2ETest(): Promise<void> {
  const validation = await validateTestEnvironment();

  if (!validation.isValid) {
    console.warn('Skipping E2E tests due to environment issues:');
    validation.errors.forEach(error => console.warn(`  - ${error}`));

    // 테스트 스킵을 위한 예외 발생
    throw new Error('E2E_TEST_SKIP');
  }
}

/**
 * 간단한 텍스트 프롬프트 생성
 */
export function createSimplePrompt(content: string = 'Hello, how are you?') {
  return {
    messages: [
      {
        role: 'user' as const,
        content: [
          {
            contentType: 'text' as const,
            value: content,
          },
        ],
      },
    ],
  };
}

/**
 * 멀티턴 대화 프롬프트 생성
 */
export function createMultiTurnPrompt() {
  return {
    messages: [
      {
        role: 'user' as const,
        content: [
          {
            contentType: 'text' as const,
            value: 'Hello, my name is Alice.',
          },
        ],
      },
      {
        role: 'assistant' as const,
        content: [
          {
            contentType: 'text' as const,
            value: 'Hello Alice! Nice to meet you.',
          },
        ],
      },
      {
        role: 'user' as const,
        content: [
          {
            contentType: 'text' as const,
            value: 'What is my name?',
          },
        ],
      },
    ],
  };
}

/**
 * 테스트 실행 시간 측정
 */
export class TestTimer {
  private startTime: number = 0;

  start(): void {
    this.startTime = Date.now();
  }

  getElapsedMs(): number {
    return Date.now() - this.startTime;
  }

  getElapsedSeconds(): number {
    return this.getElapsedMs() / 1000;
  }
}

/**
 * 비동기 함수의 실행 시간 측정
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; elapsedMs: number }> {
  const timer = new TestTimer();
  timer.start();
  const result = await fn();
  return {
    result,
    elapsedMs: timer.getElapsedMs(),
  };
}

/**
 * 스트리밍 응답 수집 유틸리티
 */
export async function collectStreamingResponse<T>(
  stream: AsyncGenerator<T, void, unknown>
): Promise<T[]> {
  const chunks: T[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return chunks;
}

/**
 * 네트워크 에러 시뮬레이션을 위한 유효하지 않은 호스트 생성
 */
export function getInvalidHost(): string {
  return 'http://non-existent-host-12345.com:11434';
}

/**
 * 연결 거부 시뮬레이션을 위한 사용하지 않는 포트 생성
 */
export function getUnusedPort(): string {
  return 'http://localhost:99999';
}

/**
 * 테스트용 에러 타입 체크 헬퍼 함수들 (다시 export)
 */
export { isWrappedError, isConfigurationErrorWithCause };
