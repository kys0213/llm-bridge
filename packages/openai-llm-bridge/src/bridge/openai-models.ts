import { LlmModelInfo, LlmModelPricing } from 'llm-bridge-spec';

/**
 * OpenAI 모델 enum
 */
export enum OpenAIModelEnum {
  // GPT-5 모델들 (최신, 가장 진보된 모델)
  GPT_5 = 'gpt-5',
  GPT_5_MINI = 'gpt-5-mini',
  GPT_5_NANO = 'gpt-5-nano',

  // GPT-4o 모델들 (최신, 가장 능력이 뛰어남)
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',

  // GPT-4 모델들 (높은 품질, 복잡한 추론)
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_4_TURBO_PREVIEW = 'gpt-4-turbo-preview',
  GPT_4 = 'gpt-4',

  // GPT-3.5 모델들 (빠르고 비용 효율적)
  GPT_35_TURBO = 'gpt-3.5-turbo',
  GPT_35_TURBO_16K = 'gpt-3.5-turbo-16k',

  // o1 모델들 (추론 특화)
  O1_PREVIEW = 'o1-preview',
  O1_MINI = 'o1-mini',
}

/**
 * 모델별 메타데이터 인터페이스
 */
export interface ModelMetadata {
  family: string;
  version: string;
  contextWindowTokens: number;
  maxTokens: number;
  pricing: LlmModelPricing;
}

/**
 * OpenAI 모델별 메타데이터 정의
 */
export const MODEL_METADATA: Record<OpenAIModelEnum, ModelMetadata> = {
  // GPT-5 시리즈
  [OpenAIModelEnum.GPT_5]: {
    family: 'GPT-5',
    version: '5',
    contextWindowTokens: 272000,
    maxTokens: 128000,
    pricing: { unit: 1000000, currency: 'USD', prompt: 1.25, completion: 10.0 },
  },
  [OpenAIModelEnum.GPT_5_MINI]: {
    family: 'GPT-5 Mini',
    version: '5',
    contextWindowTokens: 272000,
    maxTokens: 128000,
    pricing: { unit: 1000000, currency: 'USD', prompt: 0.25, completion: 2.0 },
  },
  [OpenAIModelEnum.GPT_5_NANO]: {
    family: 'GPT-5 Nano',
    version: '5',
    contextWindowTokens: 272000,
    maxTokens: 128000,
    pricing: { unit: 1000000, currency: 'USD', prompt: 0.05, completion: 0.4 },
  },

  // GPT-4o 시리즈
  [OpenAIModelEnum.GPT_4O]: {
    family: 'GPT-4o',
    version: '4',
    contextWindowTokens: 128000,
    maxTokens: 16384,
    pricing: { unit: 1000000, currency: 'USD', prompt: 5.0, completion: 15.0 },
  },
  [OpenAIModelEnum.GPT_4O_MINI]: {
    family: 'GPT-4o Mini',
    version: '4',
    contextWindowTokens: 128000,
    maxTokens: 16384,
    pricing: { unit: 1000000, currency: 'USD', prompt: 0.15, completion: 0.6 },
  },

  // GPT-4 시리즈
  [OpenAIModelEnum.GPT_4_TURBO]: {
    family: 'GPT-4 Turbo',
    version: '4',
    contextWindowTokens: 128000,
    maxTokens: 4096,
    pricing: { unit: 1000000, currency: 'USD', prompt: 10.0, completion: 30.0 },
  },
  [OpenAIModelEnum.GPT_4_TURBO_PREVIEW]: {
    family: 'GPT-4 Turbo Preview',
    version: '4',
    contextWindowTokens: 128000,
    maxTokens: 4096,
    pricing: { unit: 1000000, currency: 'USD', prompt: 10.0, completion: 30.0 },
  },
  [OpenAIModelEnum.GPT_4]: {
    family: 'GPT-4',
    version: '4',
    contextWindowTokens: 8192,
    maxTokens: 4096,
    pricing: { unit: 1000000, currency: 'USD', prompt: 30.0, completion: 60.0 },
  },

  // GPT-3.5 시리즈
  [OpenAIModelEnum.GPT_35_TURBO]: {
    family: 'GPT-3.5 Turbo',
    version: '3.5',
    contextWindowTokens: 16385,
    maxTokens: 4096,
    pricing: { unit: 1000000, currency: 'USD', prompt: 1.0, completion: 2.0 },
  },
  [OpenAIModelEnum.GPT_35_TURBO_16K]: {
    family: 'GPT-3.5 Turbo 16K',
    version: '3.5',
    contextWindowTokens: 16385,
    maxTokens: 4096,
    pricing: { unit: 1000000, currency: 'USD', prompt: 1.0, completion: 2.0 },
  },

  // o1 시리즈
  [OpenAIModelEnum.O1_PREVIEW]: {
    family: 'o1 Preview',
    version: '1',
    contextWindowTokens: 128000,
    maxTokens: 32768,
    pricing: { unit: 1000000, currency: 'USD', prompt: 15.0, completion: 60.0 },
  },
  [OpenAIModelEnum.O1_MINI]: {
    family: 'o1 Mini',
    version: '1',
    contextWindowTokens: 128000,
    maxTokens: 65536,
    pricing: { unit: 1000000, currency: 'USD', prompt: 3.0, completion: 12.0 },
  },
};

export const OPENAI_MODELS: LlmModelInfo[] = Object.entries(MODEL_METADATA).map(([name, data]) => ({
  name,
  contextWindowTokens: data.contextWindowTokens,
  pricing: data.pricing,
}));

/**
 * 기본 메타데이터 (알려지지 않은 모델용)
 */
export const DEFAULT_MODEL_METADATA: ModelMetadata = {
  family: 'OpenAI',
  version: 'unknown',
  contextWindowTokens: 4096,
  maxTokens: 4096,
  pricing: { unit: 1000, currency: 'USD', prompt: 0, completion: 0 },
};

/**
 * 모델 메타데이터를 가져오는 헬퍼 함수
 */
export function getModelMetadata(model: string): ModelMetadata {
  const enumModel = model as OpenAIModelEnum;
  return MODEL_METADATA[enumModel] || DEFAULT_MODEL_METADATA;
}

/**
 * Helper constant for backward compatibility
 * @deprecated Use OpenAIModelEnum instead
 */
export const OpenAIModels = OpenAIModelEnum;
