import { LlmModelInfo, LlmModelPricing } from 'llm-bridge-spec';

/**
 * Google Gemini에서 지원하는 모델 ID.
 */
export enum GoogleModelEnum {
  GEMINI_1_5_FLASH = 'gemini-1.5-flash',
  GEMINI_1_5_PRO = 'gemini-1.5-pro',
  GEMINI_1_0_PRO = 'gemini-1.0-pro',
}

export interface ModelMetadata {
  family: string;
  version: string;
  description: string;
  contextWindowTokens: number;
  maxOutputTokens: number;
  pricing: LlmModelPricing;
}

const MILLION = 1_000_000;

export const MODEL_METADATA: Record<GoogleModelEnum, ModelMetadata> = {
  [GoogleModelEnum.GEMINI_1_5_FLASH]: {
    family: 'Gemini 1.5 Flash',
    version: '1.5',
    description: '대규모 컨텍스트를 저비용으로 처리하는 범용 고속 모델',
    contextWindowTokens: 1_000_000,
    maxOutputTokens: 8_192,
    pricing: { unit: MILLION, currency: 'USD', prompt: 0.35, completion: 1.05 },
  },
  [GoogleModelEnum.GEMINI_1_5_PRO]: {
    family: 'Gemini 1.5 Pro',
    version: '1.5',
    description: '정확도와 추론 능력이 강화된 풀스펙 멀티모달 모델',
    contextWindowTokens: 1_000_000,
    maxOutputTokens: 8_192,
    pricing: { unit: MILLION, currency: 'USD', prompt: 7.0, completion: 21.0 },
  },
  [GoogleModelEnum.GEMINI_1_0_PRO]: {
    family: 'Gemini 1.0 Pro',
    version: '1.0',
    description: '1.0 세대의 안정적인 프로덕션용 텍스트·이미지 모델',
    contextWindowTokens: 32_000,
    maxOutputTokens: 8_192,
    pricing: { unit: MILLION, currency: 'USD', prompt: 3.5, completion: 10.5 },
  },
};

export const GOOGLE_MODELS: LlmModelInfo[] = Object.entries(MODEL_METADATA).map(([name, data]) => ({
  name,
  contextWindowTokens: data.contextWindowTokens,
  pricing: data.pricing,
}));

export function getModelMetadata(model: GoogleModelEnum): ModelMetadata {
  return MODEL_METADATA[model];
}

/**
 * Helper constant for backward compatibility
 * @deprecated Use GoogleModelEnum instead
 */
export const GoogleModels = GoogleModelEnum;
