import { z } from 'zod';

// URL validation 정규표현식 (더 엄격하게)
const URL_REGEX =
  /^https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w._~!$&'()*+,;=:@]|%[\da-f]{2})*)*(?:\?(?:[\w._~!$&'()*+,;=:@/?]|%[\da-f]{2})*)?(?:#(?:[\w._~!$&'()*+,;=:@/?]|%[\da-f]{2})*)?$/i;

/**
 * Ollama 기본 설정 스키마
 */
export const OllamaBaseConfigSchema = z.object({
  /** Ollama 서버 호스트 (기본값: http://localhost:11434) */
  host: z
    .string()
    .min(1, 'Host cannot be empty')
    .regex(URL_REGEX, 'Host must be a valid URL')
    .optional()
    .default('http://localhost:11434'),

  /** 사용할 모델 ID (필수) */
  model: z.string().min(1, 'Model cannot be empty'),

  /** 응답 온도 (0.0 ~ 2.0) */
  temperature: z
    .number()
    .min(0, 'Temperature must be >= 0')
    .max(2, 'Temperature must be <= 2')
    .optional(),

  /** Top-p 샘플링 */
  top_p: z.number().min(0, 'Top-p must be >= 0').max(1, 'Top-p must be <= 1').optional(),

  /** Top-k 샘플링 */
  top_k: z.number().int().min(1, 'Top-k must be >= 1').optional(),

  /** 최대 토큰 수 */
  num_predict: z
    .number()
    .int()
    .min(1, 'Num_predict must be >= 1')
    .max(100000, 'Num_predict must be <= 100000')
    .optional(),

  /** 중지 시퀀스 */
  stop: z.array(z.string()).optional(),

  /** 시드 값 */
  seed: z.number().int().optional(),
});

/**
 * Ollama 기본 설정 타입
 */
export type OllamaBaseConfig = z.infer<typeof OllamaBaseConfigSchema>;
