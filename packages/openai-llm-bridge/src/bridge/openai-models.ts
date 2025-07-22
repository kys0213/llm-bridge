/**
 * OpenAI 모델 enum
 */
export enum OpenAIModelEnum {
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
  contextWindow: number;
  maxTokens: number;
}

/**
 * OpenAI 모델별 메타데이터 정의
 */
export const MODEL_METADATA: Record<OpenAIModelEnum, ModelMetadata> = {
  // GPT-4o 시리즈
  [OpenAIModelEnum.GPT_4O]: {
    family: 'GPT-4o',
    version: '4',
    contextWindow: 128000,
    maxTokens: 16384,
  },
  [OpenAIModelEnum.GPT_4O_MINI]: {
    family: 'GPT-4o Mini',
    version: '4',
    contextWindow: 128000,
    maxTokens: 16384,
  },

  // GPT-4 시리즈
  [OpenAIModelEnum.GPT_4_TURBO]: {
    family: 'GPT-4 Turbo',
    version: '4',
    contextWindow: 128000,
    maxTokens: 4096,
  },
  [OpenAIModelEnum.GPT_4_TURBO_PREVIEW]: {
    family: 'GPT-4 Turbo Preview',
    version: '4',
    contextWindow: 128000,
    maxTokens: 4096,
  },
  [OpenAIModelEnum.GPT_4]: {
    family: 'GPT-4',
    version: '4',
    contextWindow: 8192,
    maxTokens: 4096,
  },

  // GPT-3.5 시리즈
  [OpenAIModelEnum.GPT_35_TURBO]: {
    family: 'GPT-3.5 Turbo',
    version: '3.5',
    contextWindow: 16385,
    maxTokens: 4096,
  },
  [OpenAIModelEnum.GPT_35_TURBO_16K]: {
    family: 'GPT-3.5 Turbo 16K',
    version: '3.5',
    contextWindow: 16385,
    maxTokens: 4096,
  },

  // o1 시리즈
  [OpenAIModelEnum.O1_PREVIEW]: {
    family: 'o1 Preview',
    version: '1',
    contextWindow: 128000,
    maxTokens: 32768,
  },
  [OpenAIModelEnum.O1_MINI]: {
    family: 'o1 Mini',
    version: '1',
    contextWindow: 128000,
    maxTokens: 65536,
  },
};

/**
 * 기본 메타데이터 (알려지지 않은 모델용)
 */
export const DEFAULT_MODEL_METADATA: ModelMetadata = {
  family: 'OpenAI',
  version: 'unknown',
  contextWindow: 4096,
  maxTokens: 4096,
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
