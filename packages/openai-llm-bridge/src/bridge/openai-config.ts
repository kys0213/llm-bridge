import { z } from 'zod';
import { OpenAIModelEnum } from './openai-models';

/**
 * OpenAI 브릿지 설정 Zod 스키마
 */
export const OpenAIConfigSchema = z.object({
  // OpenAI API 설정
  apiKey: z.string().describe('OpenAI API key'),
  baseURL: z.string().optional().describe('Custom base URL for OpenAI API'),
  organization: z.string().optional().describe('OpenAI organization ID'),
  project: z.string().optional().describe('OpenAI project ID'),

  // 모델 설정 (enum으로 제한)
  model: z
    .nativeEnum(OpenAIModelEnum)
    .optional()
    .describe('OpenAI model name from supported models'),

  // 모델 파라미터 (기본값)
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe('Sampling temperature for response generation'),
  topP: z.number().min(0).max(1).optional().describe('Top-p nucleus sampling parameter'),
  maxTokens: z.number().min(1).optional().describe('Maximum number of tokens to generate'),
  stopSequences: z
    .array(z.string())
    .optional()
    .describe('Array of strings that will stop generation'),
  presencePenalty: z
    .number()
    .min(-2)
    .max(2)
    .optional()
    .describe('Penalty for new tokens based on presence'),
  frequencyPenalty: z
    .number()
    .min(-2)
    .max(2)
    .optional()
    .describe('Penalty for new tokens based on frequency'),

  // 고급 설정
  timeout: z.number().optional().describe('Request timeout in milliseconds'),
  maxRetries: z.number().optional().describe('Maximum number of retries'),
});

/**
 * OpenAI 브릿지 설정 타입
 */
export type OpenAIConfig = z.infer<typeof OpenAIConfigSchema>;
