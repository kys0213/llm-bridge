import { z } from 'zod';
import { AnthropicModelEnum } from './anthropic-models';

/**
 * Anthropic 브릿지 설정 Zod 스키마
 */
export const AnthropicConfigSchema = z.object({
  // Anthropic API 설정
  apiKey: z.string().describe('Anthropic API key'),
  baseURL: z.string().optional().describe('Custom base URL for Anthropic API'),

  // 모델 설정 (enum으로 제한)
  model: z
    .nativeEnum(AnthropicModelEnum)
    .optional()
    .describe('Anthropic model name from supported models'),

  // 모델 파라미터 (기본값)
  temperature: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Sampling temperature for response generation'),
  topP: z.number().min(0).max(1).optional().describe('Top-p nucleus sampling parameter'),
  maxTokens: z.number().min(1).optional().describe('Maximum number of tokens to generate'),
  stopSequences: z
    .array(z.string())
    .optional()
    .describe('Array of strings that will stop generation'),

  // Anthropic 특화 설정
  useLongContext: z
    .boolean()
    .optional()
    .describe('Enable 1M context window for supported models (Sonnet 4)'),
  useExtendedOutput: z.boolean().optional().describe('Enable 128K output tokens with beta header'),

  // 고급 설정
  timeout: z.number().optional().describe('Request timeout in milliseconds'),
  maxRetries: z.number().optional().describe('Maximum number of retries'),
});

/**
 * Anthropic 브릿지 설정 타입
 */
export type AnthropicConfig = z.infer<typeof AnthropicConfigSchema>;
