import { z } from 'zod';
import { OllamaBaseConfigSchema } from '../../types/config';

/**
 * Llama 모델별 설정 스키마
 */
export const LlamaConfigSchema = OllamaBaseConfigSchema.extend({
  /** Llama 모델명 (기본값: llama3.2) */
  model: z.string().default('llama3.2'),

  /** 최대 토큰 수 (Llama 기본값: 4096) */
  num_predict: z.number().int().min(1).optional().default(4096),
});

/**
 * Llama 모델 설정 타입
 */
export type LlamaConfig = z.infer<typeof LlamaConfigSchema>;

/**
 * 지원되는 Llama 모델 목록
 */
export const SUPPORTED_LLAMA_MODELS = [
  'llama3.2',
  'llama3.1',
  'llama3',
  'llama2',
  'llama',
] as const;

/**
 * Llama 모델의 메타데이터
 */
export interface LlamaModelInfo {
  name: string;
  version: string;
  contextWindow: number;
  maxTokens: number;
  multiModal: boolean;
  functionCalling: boolean;
}
