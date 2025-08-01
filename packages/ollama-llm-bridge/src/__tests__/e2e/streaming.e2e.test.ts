/**
 * OllamaBridge 스트리밍 기능 E2E 테스트
 * Phase 2: 고급 기능 테스트
 */

import { LlmBridgeResponse } from 'llm-bridge-spec';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { OllamaBridge } from '../../bridge/ollama-bridge';
import {
  collectStreamingResponse,
  createSimplePrompt,
  createTestBridge,
  setupE2ETest,
  TEST_CONFIG,
  TestTimer,
} from './test-utils';

describe('OllamaBridge Streaming E2E Tests', () => {
  let bridge: OllamaBridge;

  beforeAll(async () => {
    try {
      await setupE2ETest();
    } catch (error) {
      if (error instanceof Error && error.message === 'E2E_TEST_SKIP') {
        console.warn('Skipping Streaming E2E tests due to environment issues');
        return;
      }
      throw error;
    }
  });

  beforeEach(() => {
    bridge = createTestBridge();
  });

  describe('invokeStream() - 스트리밍 호출', () => {
    it(
      'should generate streaming response',
      async () => {
        const prompt = createSimplePrompt(
          'Write a short story about a cat in exactly 3 sentences.'
        );

        const stream = bridge.invokeStream(prompt);
        const chunks: LlmBridgeResponse[] = [];

        const timer = new TestTimer();
        timer.start();

        for await (const chunk of stream) {
          chunks.push(chunk);
          expect(chunk).toBeDefined();
          expect(chunk.content).toBeDefined();
          expect(chunk.content.contentType).toBe('text');
          expect(typeof chunk.content.value).toBe('string');
        }

        const elapsedMs = timer.getElapsedMs();
        console.log(`Streaming completed in ${elapsedMs}ms with ${chunks.length} chunks`);

        expect(chunks.length).toBeGreaterThan(0);

        // 모든 청크를 합쳐서 완전한 응답 확인
        const fullResponse = chunks.map(chunk => chunk.content.value).join('');
        expect(fullResponse.length).toBeGreaterThan(0);
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should handle streaming with options',
      async () => {
        const prompt = createSimplePrompt('Count from 1 to 5 slowly.');

        const stream = bridge.invokeStream(prompt, {
          temperature: 0.1,
          maxTokens: 100,
        });

        const chunks = await collectStreamingResponse(stream);

        expect(chunks.length).toBeGreaterThan(0);
        chunks.forEach(chunk => {
          expect(chunk.content.contentType).toBe('text');
          expect(typeof chunk.content.value).toBe('string');
        });
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should handle short streaming responses',
      async () => {
        const prompt = createSimplePrompt('Say "yes".');

        const stream = bridge.invokeStream(prompt);
        const chunks = await collectStreamingResponse(stream);

        expect(chunks.length).toBeGreaterThan(0);

        // 짧은 응답이라도 최소 하나의 청크는 있어야 함
        const firstChunk = chunks[0];

        if (firstChunk.content.contentType === 'text') {
          expect(firstChunk.content.value.length).toBeGreaterThan(0);
        } else {
          expect(firstChunk.content.value).toBeDefined();
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should provide usage information in streaming',
      async () => {
        const prompt = createSimplePrompt('Hello world');

        const stream = bridge.invokeStream(prompt);
        const chunks = await collectStreamingResponse(stream);

        expect(chunks.length).toBeGreaterThan(0);

        // 마지막 청크나 일부 청크에서 usage 정보가 있을 수 있음
        const hasUsageInfo = chunks.some(chunk => chunk.usage !== undefined);

        if (hasUsageInfo) {
          const chunkWithUsage = chunks.find(chunk => chunk.usage !== undefined);
          expect(chunkWithUsage!.usage!.promptTokens).toBeGreaterThan(0);
          expect(chunkWithUsage!.usage!.completionTokens).toBeGreaterThan(0);
          expect(chunkWithUsage!.usage!.totalTokens).toBeGreaterThan(0);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should measure streaming performance',
      async () => {
        const prompt = createSimplePrompt('Write a paragraph about artificial intelligence.');

        const timer = new TestTimer();
        timer.start();

        const stream = bridge.invokeStream(prompt);
        const chunks: LlmBridgeResponse[] = [];
        let firstTokenTime = 0;
        let totalTokens = 0;

        for await (const chunk of stream) {
          if (chunks.length === 0) {
            firstTokenTime = timer.getElapsedMs();
          }
          chunks.push(chunk);
          if (typeof chunk.content.value === 'string') {
            totalTokens += chunk.content.value.length;
          } else if (chunk.content.value instanceof Buffer) {
            totalTokens += chunk.content.value.length;
          }
        }

        const totalTime = timer.getElapsedMs();

        expect(chunks.length).toBeGreaterThan(0);
        expect(firstTokenTime).toBeGreaterThan(0);
        expect(totalTime).toBeGreaterThan(firstTokenTime);

        console.log(`Streaming metrics:`);
        console.log(`  - First token: ${firstTokenTime}ms`);
        console.log(`  - Total time: ${totalTime}ms`);
        console.log(`  - Chunks: ${chunks.length}`);
        console.log(`  - Characters: ${totalTokens}`);

        if (chunks.length > 1) {
          const avgChunkTime = (totalTime - firstTokenTime) / (chunks.length - 1);
          console.log(`  - Avg chunk interval: ${avgChunkTime.toFixed(2)}ms`);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('Streaming vs Regular Comparison', () => {
    it(
      'should produce similar content in streaming vs regular mode',
      async () => {
        const prompt = createSimplePrompt('What is 2+2? Answer in one sentence.');

        // 정규 호출
        const regularResponse = await bridge.invoke(prompt, { temperature: 0.1 });

        // 스트리밍 호출
        const stream = bridge.invokeStream(prompt, { temperature: 0.1 });
        const streamChunks = await collectStreamingResponse(stream);
        const streamingResponse = streamChunks.map(chunk => chunk.content.value).join('');

        expect(regularResponse.content.value).toBeDefined();
        expect(streamingResponse).toBeDefined();

        // 둘 다 '4'나 'four' 같은 답을 포함해야 함
        const answerPattern = /4|four/i;
        expect(regularResponse.content.value).toMatch(answerPattern);
        expect(streamingResponse).toMatch(answerPattern);

        console.log('Regular response:', regularResponse.content.value);
        console.log('Streaming response:', streamingResponse);
      },
      TEST_CONFIG.TEST_TIMEOUT * 2
    );
  });

  describe('Streaming Error Handling', () => {
    it(
      'should handle streaming interruption gracefully',
      async () => {
        const prompt = createSimplePrompt('Write a very long story about adventures.');

        const stream = bridge.invokeStream(prompt);
        const chunks: LlmBridgeResponse[] = [];
        let chunkCount = 0;

        try {
          for await (const chunk of stream) {
            chunks.push(chunk);
            chunkCount++;

            // 3개 청크 후 중단
            if (chunkCount >= 3) {
              break;
            }
          }

          expect(chunks.length).toBe(3);
          chunks.forEach(chunk => {
            expect(chunk.content.contentType).toBe('text');
            expect(typeof chunk.content.value).toBe('string');
          });
        } catch (error) {
          // 스트리밍 중단으로 인한 에러는 예상된 상황
          console.log('Streaming interrupted as expected:', error);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );

    it(
      'should handle empty streaming response',
      async () => {
        const prompt = createSimplePrompt('');

        try {
          const stream = bridge.invokeStream(prompt);
          const chunks = await collectStreamingResponse(stream);

          // 빈 프롬프트라도 일부 응답이 있을 수 있음
          expect(Array.isArray(chunks)).toBe(true);
        } catch (error) {
          // 빈 프롬프트로 인한 에러도 예상 가능
          expect(error).toBeDefined();
          console.log('Empty prompt error (expected):', error);
        }
      },
      TEST_CONFIG.TEST_TIMEOUT
    );
  });

  describe('Streaming Concurrency', () => {
    it(
      'should handle multiple concurrent streaming calls',
      async () => {
        const prompts = [
          createSimplePrompt('Count 1 to 3'),
          createSimplePrompt('Say hello'),
          createSimplePrompt('Name a color'),
        ];

        const streamPromises = prompts.map(async (prompt, index) => {
          const stream = bridge.invokeStream(prompt);
          const chunks = await collectStreamingResponse(stream);
          return { index, chunks };
        });

        const results = await Promise.all(streamPromises);

        expect(results).toHaveLength(3);
        results.forEach((result, index) => {
          expect(result.index).toBe(index);
          expect(result.chunks.length).toBeGreaterThan(0);
          result.chunks.forEach(chunk => {
            expect(chunk.content.contentType).toBe('text');
            expect(typeof chunk.content.value).toBe('string');
          });
        });
      },
      TEST_CONFIG.TEST_TIMEOUT * 2
    );
  });
});
