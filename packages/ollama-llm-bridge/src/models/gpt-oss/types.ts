import { z } from 'zod';
import { OllamaBaseConfigSchema } from '../../types/config';

/**
 * GPT-OSS 모델별 설정 스키마
 */
export const GptOssConfigSchema = OllamaBaseConfigSchema.extend({
  /** GPT-OSS 모델명 (기본값: gpt-oss-20:b) */
  model: z.string().default('gpt-oss-20:b'),

  /** 최대 토큰 수 (기본값: 4096) */
  num_predict: z.number().int().min(1).optional().default(4096),
});

/**
 * GPT-OSS 모델 설정 타입
 */
export type GptOssConfig = z.infer<typeof GptOssConfigSchema>;

/**
 * 지원되는 GPT-OSS 모델 목록
 */
export const SUPPORTED_GPT_OSS_MODELS = ['gpt-oss-20:b', 'gpt-oss-20b'] as const;

/**
 * GPT-OSS 모델의 메타데이터
 */
export interface GptOssModelInfo {
  name: string;
  version: string;
  contextWindow: number;
  maxTokens: number;
  multiModal: boolean;
  functionCalling: boolean;
}
