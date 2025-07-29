import { z } from 'zod';

/**
 * Ollama 기본 설정 스키마
 */
export const OllamaBaseConfigSchema = z.object({
  /** Ollama 서버 호스트 (기본값: http://localhost:11434) */
  host: z.string().optional().default('http://localhost:11434'),

  /** 사용할 모델 ID (필수) */
  model: z.string(),

  /** 응답 온도 (0.0 ~ 1.0) */
  temperature: z.number().min(0).max(1).optional(),

  /** Top-p 샘플링 */
  top_p: z.number().min(0).max(1).optional(),

  /** Top-k 샘플링 */
  top_k: z.number().int().min(1).optional(),

  /** 최대 토큰 수 */
  num_predict: z.number().int().min(1).optional(),

  /** 중지 시퀀스 */
  stop: z.array(z.string()).optional(),

  /** 시드 값 */
  seed: z.number().int().optional(),

  /** 스트리밍 여부 */
  stream: z.boolean().optional().default(false),
});

/**
 * Ollama 기본 설정 타입
 */
export type OllamaBaseConfig = z.infer<typeof OllamaBaseConfigSchema>;
