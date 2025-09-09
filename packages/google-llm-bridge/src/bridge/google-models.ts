import { LlmModelInfo, LlmModelPricing } from 'llm-bridge-spec';

/**
 * Google Gemini 모델 enum
 */
export enum GoogleModelEnum {
  GEMINI_1_5_FLASH = 'gemini-1.5-flash',
  GEMINI_1_5_PRO = 'gemini-1.5-pro',
  GEMINI_1_0_PRO = 'gemini-1.0-pro',
}

export interface ModelMetadata {
  family: string;
  version: string;
  contextWindowTokens: number;
  maxTokens: number;
  pricing: LlmModelPricing;
}

export const MODEL_METADATA: Record<GoogleModelEnum, ModelMetadata> = {
  [GoogleModelEnum.GEMINI_1_5_FLASH]: {
    family: 'Gemini 1.5 Flash',
    version: '1.5',
    contextWindowTokens: 1000000,
    maxTokens: 8192,
    pricing: { unit: 1000000, currency: 'USD', prompt: 0, completion: 0 },
  },
  [GoogleModelEnum.GEMINI_1_5_PRO]: {
    family: 'Gemini 1.5 Pro',
    version: '1.5',
    contextWindowTokens: 1000000,
    maxTokens: 8192,
    pricing: { unit: 1000000, currency: 'USD', prompt: 0, completion: 0 },
  },
  [GoogleModelEnum.GEMINI_1_0_PRO]: {
    family: 'Gemini 1.0 Pro',
    version: '1.0',
    contextWindowTokens: 32000,
    maxTokens: 8192,
    pricing: { unit: 1000000, currency: 'USD', prompt: 0, completion: 0 },
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
