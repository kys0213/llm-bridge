import { LlmModelInfo, LlmModelPricing } from 'llm-bridge-spec';

/**
 * Anthropic Claude 모델 enum
 */
export enum AnthropicModelEnum {
  // Claude Opus 4.1 (최고 성능, 복잡한 추론)
  CLAUDE_OPUS_4_1 = 'claude-opus-4.1',

  // Claude Sonnet 4 (고성능, 효율적)
  CLAUDE_SONNET_4 = 'claude-sonnet-4',

  // Claude Sonnet 3.7 (이전 세대)
  CLAUDE_SONNET_3_7 = 'claude-sonnet-3.7',

  // Claude Haiku 3.5 (빠르고 경량)
  CLAUDE_HAIKU_3_5 = 'claude-haiku-3.5',
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
  supportsLongContext?: boolean;
  longContextPricing?: LlmModelPricing;
}

/**
 * Anthropic 모델별 메타데이터 정의
 */
export const MODEL_METADATA: Record<AnthropicModelEnum, ModelMetadata> = {
  // Claude Opus 4.1 시리즈
  [AnthropicModelEnum.CLAUDE_OPUS_4_1]: {
    family: 'Claude Opus',
    version: '4.1',
    contextWindowTokens: 200000,
    maxTokens: 128000,
    pricing: { unit: 1000000, currency: 'USD', prompt: 15.0, completion: 75.0 },
  },

  // Claude Sonnet 4 시리즈
  [AnthropicModelEnum.CLAUDE_SONNET_4]: {
    family: 'Claude Sonnet',
    version: '4',
    contextWindowTokens: 200000,
    maxTokens: 128000,
    pricing: { unit: 1000000, currency: 'USD', prompt: 3.0, completion: 15.0 },
    supportsLongContext: true,
    longContextPricing: { unit: 1000000, currency: 'USD', prompt: 6.0, completion: 22.5 },
  },

  // Claude Sonnet 3.7 시리즈
  [AnthropicModelEnum.CLAUDE_SONNET_3_7]: {
    family: 'Claude Sonnet',
    version: '3.7',
    contextWindowTokens: 200000,
    maxTokens: 8192,
    pricing: { unit: 1000000, currency: 'USD', prompt: 3.0, completion: 15.0 },
  },

  // Claude Haiku 3.5 시리즈
  [AnthropicModelEnum.CLAUDE_HAIKU_3_5]: {
    family: 'Claude Haiku',
    version: '3.5',
    contextWindowTokens: 200000,
    maxTokens: 8192,
    pricing: { unit: 1000000, currency: 'USD', prompt: 0.8, completion: 4.0 },
  },
};

export const ANTHROPIC_MODELS: LlmModelInfo[] = Object.entries(MODEL_METADATA).map(([name, data]) => ({
  name,
  contextWindowTokens: data.contextWindowTokens,
  pricing: data.pricing,
}));

/**
 * 기본 메타데이터 (알려지지 않은 모델용)
 */
export const DEFAULT_MODEL_METADATA: ModelMetadata = {
  family: 'Anthropic',
  version: 'unknown',
  contextWindowTokens: 200000,
  maxTokens: 8192,
  pricing: { unit: 1000000, currency: 'USD', prompt: 0, completion: 0 },
};

/**
 * 모델 메타데이터를 가져오는 헬퍼 함수
 */
export function getModelMetadata(model: string): ModelMetadata {
  const enumModel = model as AnthropicModelEnum;
  return MODEL_METADATA[enumModel] || DEFAULT_MODEL_METADATA;
}

/**
 * 1M 컨텍스트 지원 모델인지 확인
 */
export function supportsLongContext(model: string): boolean {
  const metadata = getModelMetadata(model);
  return metadata.supportsLongContext === true;
}

/**
 * 긴 컨텍스트 사용 시 가격 정보 반환
 */
export function getLongContextPricing(model: string): LlmModelPricing | undefined {
  const metadata = getModelMetadata(model);
  return metadata.longContextPricing;
}

/**
 * Helper constant for backward compatibility
 * @deprecated Use AnthropicModelEnum instead
 */
export const AnthropicModels = AnthropicModelEnum;