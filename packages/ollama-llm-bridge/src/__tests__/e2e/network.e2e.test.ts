/**
 * OllamaBridge 네트워크 관련 E2E 테스트
 * Phase 3: 에러 처리 테스트 - NetworkError, ServiceUnavailableError
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { NetworkError, ServiceUnavailableError, TimeoutError } from 'llm-bridge-spec';

import { createOllamaBridge } from '../../factory/ollama-factory';
import {
  setupE2ETest,
  createSimplePrompt,
  getInvalidHost,
  getUnusedPort,
  TEST_CONFIG,
} from './test-utils';

describe('Network Error E2E Tests', () => {
  beforeAll(async () => {
    try {
      await setupE2ETest();
    } catch (error) {
      if (error instanceof Error && error.message === 'E2E_TEST_SKIP') {
        console.warn('Skipping Network E2E tests due to environment issues');
        return;
      }
      throw error;
    }
  });

  describe('NetworkError - 네트워크 연결 문제', () => {
    it(
      'should throw NetworkError for DNS resolution failure',
      async () => {
        const bridge = createOllamaBridge({
          host: getInvalidHost(),
          model: TEST_CONFIG.TEST_MODEL,
        });

        const prompt = createSimplePrompt('Hello');

        await expect(bridge.invoke(prompt)).rejects.toThrow(NetworkError);
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should throw NetworkError for connection timeout',
      async () => {
        // 존재하지 않는 IP 주소로 타임아웃 유발
        const bridge = createOllamaBridge({
          host: 'http://192.168.255.255:11434', // 비할당 IP 주소
          model: TEST_CONFIG.TEST_MODEL,
        });

        const prompt = createSimplePrompt('Hello');

        await expect(bridge.invoke(prompt)).rejects.toThrow(NetworkError);
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should include original error information in NetworkError',
      async () => {
        const bridge = createOllamaBridge({
          host: getInvalidHost(),
          model: TEST_CONFIG.TEST_MODEL,
        });

        try {
          await bridge.invoke(createSimplePrompt('Hello'));
          throw new Error('Expected NetworkError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(NetworkError);
          const networkError = error as NetworkError;

          expect(networkError.message).toContain('Network error');
          expect(networkError.cause).toBeDefined();

          console.log('Network error message:', networkError.message);
          console.log('Network error cause:', networkError.cause);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should handle network errors in streaming',
      async () => {
        const bridge = createOllamaBridge({
          host: getInvalidHost(),
          model: TEST_CONFIG.TEST_MODEL,
        });

        const prompt = createSimplePrompt('Write a story');

        try {
          const stream = bridge.invokeStream(prompt);
          // 스트림을 시작하려고 시도
          for await (const chunk of stream) {
            // 여기에 도달하면 안 됨
            console.error('Unexpected chunk received:', chunk);
            throw new Error('Should not receive any chunks from invalid host');
          }
        } catch (error) {
          expect(error).toBeInstanceOf(NetworkError);
          console.log('Streaming network error:', error);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('ServiceUnavailableError - 서비스 이용 불가', () => {
    it(
      'should throw ServiceUnavailableError for connection refused',
      async () => {
        const bridge = createOllamaBridge({
          host: getUnusedPort(),
          model: TEST_CONFIG.TEST_MODEL,
        });

        const prompt = createSimplePrompt('Hello');

        try {
          await bridge.invoke(prompt);
          throw new Error('Expected ServiceUnavailableError to be thrown');
        } catch (error) {
          // ECONNREFUSED는 ServiceUnavailableError로 매핑되어야 함
          expect(error).toBeInstanceOf(ServiceUnavailableError);
          const serviceError = error as ServiceUnavailableError;

          expect(serviceError.message).toContain('Ollama server');
          expect(serviceError.statusCode).toBe(503);
          expect(serviceError.retryAfter).toBeDefined();

          console.log('Service unavailable error:', serviceError.message);
          console.log('Retry after:', serviceError.retryAfter);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should provide retry information in ServiceUnavailableError',
      async () => {
        const bridge = createOllamaBridge({
          host: getUnusedPort(),
          model: TEST_CONFIG.TEST_MODEL,
        });

        try {
          await bridge.invoke(createSimplePrompt('Hello'));
          throw new Error('Expected ServiceUnavailableError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceUnavailableError);
          const serviceError = error as ServiceUnavailableError;

          // 재시도 관련 정보가 있어야 함
          expect(typeof serviceError.retryAfter).toBe('number');
          expect(serviceError.retryAfter).toBeGreaterThan(0);

          // 합리적인 재시도 시간 (1분 또는 2분)
          expect(serviceError.retryAfter).toBeLessThanOrEqual(120);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should handle service unavailable in streaming',
      async () => {
        const bridge = createOllamaBridge({
          host: getUnusedPort(),
          model: TEST_CONFIG.TEST_MODEL,
        });

        try {
          const stream = bridge.invokeStream(createSimplePrompt('Hello'));
          for await (const chunk of stream) {
            console.error('Unexpected chunk received:', chunk);
            throw new Error('Should not receive chunks when service is unavailable');
          }
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceUnavailableError);
          console.log('Streaming service unavailable error:', error);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('Network Error Recovery', () => {
    it(
      'should handle alternating network states',
      async () => {
        // 잘못된 호스트로 실패
        const badBridge = createOllamaBridge({
          host: getInvalidHost(),
          model: TEST_CONFIG.TEST_MODEL,
        });

        await expect(badBridge.invoke(createSimplePrompt('Hello'))).rejects.toThrow(NetworkError);

        // 올바른 호스트로 성공 (실제 환경에서만)
        const goodBridge = createOllamaBridge({
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
        });

        const response = await goodBridge.invoke(createSimplePrompt('Hello'));
        expect(response).toBeDefined();
        expect(response.content.contentType).toBe('text');
      },
      TEST_CONFIG.TEST_TIMEOUT * 2
    );

    it(
      'should not affect other bridge instances after network error',
      async () => {
        // 첫 번째 브릿지: 네트워크 에러
        const errorBridge = createOllamaBridge({
          host: getInvalidHost(),
          model: TEST_CONFIG.TEST_MODEL,
        });

        // 두 번째 브릿지: 정상 동작
        const workingBridge = createOllamaBridge({
          host: TEST_CONFIG.OLLAMA_HOST,
          model: TEST_CONFIG.TEST_MODEL,
        });

        // 에러 브릿지는 실패해야 함
        await expect(errorBridge.invoke(createSimplePrompt('Hello'))).rejects.toThrow(NetworkError);

        // 정상 브릿지는 영향받지 않고 동작해야 함
        const response = await workingBridge.invoke(createSimplePrompt('Hello'));
        expect(response).toBeDefined();
        expect(response.content.contentType).toBe('text');
      },
      TEST_CONFIG.TEST_TIMEOUT * 2
    );
  });

  describe('Timeout Scenarios', () => {
    it(
      'should handle very slow network responses',
      async () => {
        // 매우 느린 응답을 시뮬레이션하기 위해 외부 IP 사용
        const bridge = createOllamaBridge({
          host: 'http://1.2.3.4:11434', // 존재하지 않지만 라우팅 가능한 주소
          model: TEST_CONFIG.TEST_MODEL,
        });

        const startTime = Date.now();

        try {
          await bridge.invoke(createSimplePrompt('Hello'));
          throw new Error('Expected timeout or network error');
        } catch (error) {
          const elapsedMs = Date.now() - startTime;

          // 네트워크 에러 또는 타임아웃 에러여야 함
          expect(error).toSatisfy(
            (err: any) => err instanceof NetworkError || err instanceof TimeoutError
          );

          console.log(`Network timeout test completed in ${elapsedMs}ms`);
          console.log('Error type:', error.constructor.name);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should provide appropriate timeout values',
      async () => {
        const bridge = createOllamaBridge({
          host: getUnusedPort(),
          model: TEST_CONFIG.TEST_MODEL,
        });

        try {
          await bridge.invoke(createSimplePrompt('Hello'));
          throw new Error('Expected error to be thrown');
        } catch (error) {
          if (error instanceof TimeoutError) {
            expect(error.timeoutMs).toBeDefined();
            expect(error.timeoutMs).toBeGreaterThan(0);
            console.log('Timeout value:', error.timeoutMs);
          } else if (error instanceof ServiceUnavailableError) {
            expect(error.retryAfter).toBeDefined();
            expect(error.retryAfter).toBeGreaterThan(0);
            console.log('Retry after:', error.retryAfter);
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('Network Error Message Quality', () => {
    it(
      'should provide helpful error messages for different network failures',
      async () => {
        const testCases = [
          {
            name: 'DNS failure',
            host: getInvalidHost(),
            expectedInMessage: ['Network error', 'Ollama API'],
          },
          {
            name: 'Connection refused',
            host: getUnusedPort(),
            expectedInMessage: ['Ollama server', 'not running', 'not accessible'],
          },
        ];

        for (const testCase of testCases) {
          const bridge = createOllamaBridge({
            host: testCase.host,
            model: TEST_CONFIG.TEST_MODEL,
          });

          try {
            await bridge.invoke(createSimplePrompt('Hello'));
            throw new Error(`Expected error for ${testCase.name}`);
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
            const errorMessage = (error as Error).message.toLowerCase();

            // 에러 메시지에 유용한 정보가 포함되어 있는지 확인
            const hasUsefulInfo = testCase.expectedInMessage.some(phrase =>
              errorMessage.includes(phrase.toLowerCase())
            );

            expect(hasUsefulInfo).toBe(true);
            console.log(`${testCase.name} error message:`, (error as Error).message);
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT * 2
    );

    it(
      'should include cause information in network errors',
      async () => {
        const bridge = createOllamaBridge({
          host: getInvalidHost(),
          model: TEST_CONFIG.TEST_MODEL,
        });

        try {
          await bridge.invoke(createSimplePrompt('Hello'));
          throw new Error('Expected NetworkError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(NetworkError);
          const networkError = error as NetworkError;

          expect(networkError.cause).toBeDefined();
          expect(networkError.cause).toBeInstanceOf(Error);

          console.log('Original cause:', networkError.cause);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });
});
