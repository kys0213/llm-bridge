import { z } from 'zod';
import { OllamaBaseConfigSchema } from '../../types/config';

/**
 * Gemma 모델별 설정 스키마
 */
export const GemmaConfigSchema = OllamaBaseConfigSchema.extend({
  /** Gemma 모델명 (기본값: gemma3n:latest) */
  model: z.string().default('gemma3n:latest'),

  /** 최대 토큰 수 (Gemma 기본값: 2048) */
  num_predict: z.number().int().min(1).optional().default(2048),
});

/**
 * Gemma 모델 설정 타입
 */
export type GemmaConfig = z.infer<typeof GemmaConfigSchema>;

/**
 * 지원되는 Gemma 모델 목록
 */
export const SUPPORTED_GEMMA_MODELS = [
  'gemma3n:latest',
  'gemma3n:7b',
  'gemma3n:2b',
  'gemma2:latest',
  'gemma2:7b',
  'gemma2:2b',
  'gemma:latest',
  'gemma:7b',
  'gemma:2b',
] as const;

/**
 * Gemma 모델의 메타데이터
 */
export interface GemmaModelInfo {
  name: string;
  version: string;
  contextWindow: number;
  maxTokens: number;
  multiModal: boolean;
  functionCalling: boolean;
  modelSize: '2b' | '7b' | 'latest';
}
