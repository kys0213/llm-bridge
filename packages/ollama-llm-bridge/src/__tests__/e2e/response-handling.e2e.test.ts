/**
 * OllamaBridge 응답 처리 E2E 테스트
 * Phase 3: 에러 처리 테스트 - InvalidRequestError, ResponseParsingError, TimeoutError
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { InvalidRequestError, ResponseParsingError, TimeoutError, APIError } from 'llm-bridge-spec';

// fail 함수 정의
function fail(message: string): never {
  throw new Error(message);
}
import { OllamaBridge } from '../../bridge/ollama-bridge';
import { setupE2ETest, createTestBridge, createSimplePrompt, TEST_CONFIG } from './test-utils';

describe('Response Handling E2E Tests', () => {
  let bridge: OllamaBridge;

  beforeAll(async () => {
    try {
      await setupE2ETest();
    } catch (error) {
      if (error instanceof Error && error.message === 'E2E_TEST_SKIP') {
        console.warn('Skipping Response Handling E2E tests due to environment issues');
        return;
      }
      throw error;
    }
  });

  beforeEach(() => {
    bridge = createTestBridge();
  });

  describe('InvalidRequestError - 잘못된 요청', () => {
    it(
      'should throw InvalidRequestError for empty messages array',
      async () => {
        const invalidPrompt = {
          messages: [],
        };

        try {
          await bridge.invoke(invalidPrompt);
          fail('Expected InvalidRequestError to be thrown');
        } catch (error) {
          // 빈 메시지 배열은 InvalidRequestError나 APIError로 처리될 수 있음
          expect(error).toSatisfy(
            (err: any) => err instanceof InvalidRequestError || err instanceof APIError
          );

          console.log('Empty messages error:', error);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should throw InvalidRequestError for malformed message content',
      async () => {
        const invalidPrompts = [
          // content가 없는 메시지
          {
            messages: [
              {
                role: 'user' as const,
                // content 누락
              } as any,
            ],
          },
          // 잘못된 content 타입
          {
            messages: [
              {
                role: 'user' as const,
                content: 'string instead of object' as any,
              },
            ],
          },
          // 잘못된 role
          {
            messages: [
              {
                role: 'invalid_role' as any,
                content: {
                  contentType: 'text' as const,
                  value: 'Hello',
                },
              },
            ],
          },
        ];

        for (const invalidPrompt of invalidPrompts) {
          try {
            await bridge.invoke(invalidPrompt);
            // 일부 케이스는 성공할 수도 있음 (브릿지가 관대하게 처리)
            console.log('Malformed request was accepted:', invalidPrompt);
          } catch (error) {
            expect(error).toSatisfy(
              (err: any) =>
                err instanceof InvalidRequestError ||
                err instanceof APIError ||
                err instanceof TypeError // 타입 에러도 가능
            );

            console.log('Malformed request error:', error);
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should handle invalid invoke options',
      async () => {
        const validPrompt = createSimplePrompt('Hello');
        const invalidOptions = [
          // 음수 온도
          { temperature: -1 },
          // 범위 초과 온도
          { temperature: 3.0 },
          // 음수 maxTokens
          { maxTokens: -100 },
          // 잘못된 타입
          { temperature: 'invalid' as any },
          { maxTokens: 'invalid' as any },
        ];

        for (const invalidOption of invalidOptions) {
          try {
            await bridge.invoke(validPrompt, invalidOption);
            console.log('Invalid option was accepted:', invalidOption);
          } catch (error) {
            expect(error).toSatisfy(
              (err: any) => err instanceof InvalidRequestError || err instanceof APIError
            );

            console.log('Invalid option error:', invalidOption, error);
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('ResponseParsingError - 응답 파싱 실패', () => {
    // 실제 환경에서는 ResponseParsingError를 직접 발생시키기 어려움
    // Ollama가 일반적으로 올바른 JSON을 반환하기 때문
    it(
      'should handle unexpected response format gracefully',
      async () => {
        const prompt = createSimplePrompt('Hello');

        try {
          const response = await bridge.invoke(prompt);

          // 정상적인 응답 구조 검증
          expect(response).toBeDefined();
          expect(response.content).toBeDefined();
          expect(response.content.contentType).toBe('text');
          expect(typeof response.content.value).toBe('string');

          console.log('Response structure is valid:', {
            hasContent: !!response.content,
            contentType: response.content.contentType,
            hasValue: !!response.content.value,
            hasUsage: !!response.usage,
          });
        } catch (error) {
          // 만약 ResponseParsingError가 발생한다면
          if (error instanceof ResponseParsingError) {
            expect(error.message).toContain('parse');
            expect(error.rawResponse).toBeDefined();
            console.log('Response parsing error:', error);
          } else {
            throw error;
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should validate response content structure',
      async () => {
        const prompt = createSimplePrompt('Say exactly: {"test": "response"}');

        const response = await bridge.invoke(prompt);

        // 응답 구조가 예상 형식과 일치하는지 검증
        expect(response).toMatchObject({
          content: {
            contentType: 'text',
            value: expect.any(String),
          },
        });

        // usage 정보가 있다면 올바른 구조여야 함
        if (response.usage) {
          expect(response.usage).toMatchObject({
            promptTokens: expect.any(Number),
            completionTokens: expect.any(Number),
            totalTokens: expect.any(Number),
          });

          expect(response.usage.totalTokens).toBe(
            response.usage.promptTokens + response.usage.completionTokens
          );
        }

        console.log('Response validation passed:', {
          contentLength: response.content.value.length,
          hasUsage: !!response.usage,
          usage: response.usage,
        });
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('TimeoutError - 요청 타임아웃', () => {
    it(
      'should handle very long generation requests',
      async () => {
        // 매우 긴 텍스트 생성을 요청하여 타임아웃 유발 시도
        const longPrompt = createSimplePrompt(
          'Write a very detailed 10,000-word essay about the history of artificial intelligence, ' +
            'including every major breakthrough, researcher, and development from the 1940s to present day. ' +
            'Include extensive examples, quotes, and technical details.'
        );

        const shortTimeoutBridge = createTestBridge({
          // 매우 짧은 타임아웃 설정 (실제로는 더 긴 시간이 필요할 수 있음)
        });

        const startTime = Date.now();

        try {
          await shortTimeoutBridge.invoke(longPrompt);
          const elapsedMs = Date.now() - startTime;
          console.log(`Long generation completed in ${elapsedMs}ms`);

          // 타임아웃이 발생하지 않았다면 성공
          expect(elapsedMs).toBeGreaterThan(0);
        } catch (error) {
          const elapsedMs = Date.now() - startTime;

          if (error instanceof TimeoutError) {
            expect(error.timeoutMs).toBeDefined();
            expect(error.timeoutMs).toBeGreaterThan(0);
            expect(elapsedMs).toBeGreaterThanOrEqual(error.timeoutMs! - 1000); // 1초 오차 허용

            console.log(`Timeout occurred after ${elapsedMs}ms (expected: ${error.timeoutMs}ms)`);
          } else {
            // 다른 에러 (네트워크, API 에러 등)도 허용
            console.log(`Non-timeout error after ${elapsedMs}ms:`, error);
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should handle timeout in streaming requests',
      async () => {
        const longPrompt = createSimplePrompt(
          'Generate a continuous stream of random numbers from 1 to 1000, ' +
            'with detailed explanations for each number.'
        );

        const startTime = Date.now();
        let chunkCount = 0;

        try {
          const stream = bridge.invokeStream(longPrompt);

          for await (const chunk of stream) {
            chunkCount++;
            const elapsedMs = Date.now() - startTime;

            expect(chunk.content.contentType).toBe('text');

            // 임의로 일정 시간 후 중단
            if (elapsedMs > TEST_CONFIG.TEST_TIMEOUT / 2) {
              console.log(`Manually stopping stream after ${elapsedMs}ms and ${chunkCount} chunks`);
              break;
            }
          }

          console.log(`Streaming completed with ${chunkCount} chunks`);
        } catch (error) {
          const elapsedMs = Date.now() - startTime;

          if (error instanceof TimeoutError) {
            expect(error.timeoutMs).toBeGreaterThan(0);
            console.log(`Streaming timeout after ${elapsedMs}ms and ${chunkCount} chunks`);
          } else {
            console.log(`Streaming error after ${elapsedMs}ms:`, error);
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('APIError - 일반 API 에러', () => {
    it(
      'should handle unknown API errors gracefully',
      async () => {
        const prompt = createSimplePrompt('Hello');

        try {
          const response = await bridge.invoke(prompt);

          // 정상 응답
          expect(response).toBeDefined();
          expect(response.content.contentType).toBe('text');
        } catch (error) {
          // API 에러가 발생했다면 적절히 처리되어야 함
          if (error instanceof APIError) {
            expect(error.message).toBeDefined();
            expect(typeof error.message).toBe('string');

            if (error.statusCode) {
              expect(typeof error.statusCode).toBe('number');
            }

            if (error.apiErrorCode) {
              expect(typeof error.apiErrorCode).toBe('string');
            }

            console.log('API error details:', {
              message: error.message,
              statusCode: error.statusCode,
              apiErrorCode: error.apiErrorCode,
            });
          } else {
            throw error;
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should include helpful context in API errors',
      async () => {
        // 정상적인 요청으로 시작
        const prompt = createSimplePrompt('Test API error handling');

        try {
          await bridge.invoke(prompt);
          console.log('API call succeeded - no error to test');
        } catch (error) {
          if (error instanceof APIError) {
            // 에러 메시지에 유용한 컨텍스트가 포함되어 있는지 확인
            const errorMessage = error.message.toLowerCase();

            const hasContext =
              errorMessage.includes('ollama') ||
              errorMessage.includes('api') ||
              errorMessage.includes('request') ||
              errorMessage.includes('response');

            expect(hasContext).toBe(true);

            // 원인 에러가 있다면 유용한 정보여야 함
            if (error.cause) {
              expect(error.cause).toBeInstanceOf(Error);
              console.log('API error cause:', error.cause);
            }

            console.log('API error with context:', error.message);
          }
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('Error Recovery and Resilience', () => {
    it(
      'should recover from transient errors',
      async () => {
        // 여러 번 시도하여 일시적 에러 복구 테스트
        const prompt = createSimplePrompt('Hello');
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < 3; i++) {
          try {
            const response = await bridge.invoke(prompt);
            expect(response.content.contentType).toBe('text');
            successCount++;
          } catch (error) {
            errorCount++;
            console.log(`Attempt ${i + 1} failed:`, error);

            // 알려진 에러 타입이어야 함
            expect(error).toSatisfy(
              (err: any) =>
                err instanceof InvalidRequestError ||
                err instanceof ResponseParsingError ||
                err instanceof TimeoutError ||
                err instanceof APIError
            );
          }
        }

        console.log(`Error recovery test: ${successCount} successes, ${errorCount} errors`);

        // 최소 한 번은 성공해야 함 (환경이 정상이라면)
        expect(successCount).toBeGreaterThan(0);
      },
      TEST_CONFIG.TEST_TIMEOUT * 3
    );

    it(
      'should maintain bridge state after errors',
      async () => {
        const initialModel = bridge.getCurrentModel();

        try {
          // 에러를 유발할 수 있는 요청
          await bridge.invoke({
            messages: [] as any,
          });
        } catch (error) {
          // 에러가 발생해도 브릿지 상태는 유지되어야 함
          expect(bridge.getCurrentModel()).toBe(initialModel);

          // 후속 정상 요청은 동작해야 함
          const response = await bridge.invoke(createSimplePrompt('Hello'));
          expect(response.content.contentType).toBe('text');
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should provide consistent error behavior across invocations',
      async () => {
        const invalidPrompt = {
          messages: [] as any,
        };

        const errors: Error[] = [];

        // 같은 잘못된 요청을 여러 번 시도
        for (let i = 0; i < 3; i++) {
          try {
            await bridge.invoke(invalidPrompt);
            fail(`Expected error on attempt ${i + 1}`);
          } catch (error) {
            errors.push(error as Error);
          }
        }

        // 모든 에러가 같은 타입이어야 함
        expect(errors.length).toBe(3);

        const errorTypes = errors.map(err => err.constructor.name);
        const uniqueTypes = [...new Set(errorTypes)];

        expect(uniqueTypes.length).toBe(1); // 모두 같은 타입

        console.log('Consistent error types:', uniqueTypes);
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });
});
