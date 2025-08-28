import type { MultiModalContent } from 'llm-bridge-spec';

export interface EmbeddingRequest {
  /**
   * 임베딩 대상 입력. 텍스트 또는 멀티모달 콘텐츠, 혹은 그 배열
   */
  input: string | MultiModalContent | (string | MultiModalContent)[];
}

export interface EmbeddingResponse {
  /**
   * 요청된 입력에 대한 벡터 임베딩
   */
  embeddings: number[] | number[][];
  usage?: EmbeddingUsage;
}

export interface EmbeddingUsage {
  /** 사용된 토큰 수 */
  promptTokens: number;
}

export interface EmbeddingOption {
  [key: string]: unknown;
}

export interface EmbeddingModelMetadata {
  /** 모델 식별자 */
  model: string;
  /** 임베딩 차원 수 */
  dimension: number;
}

export interface EmbeddingBridge {
  embed(request: EmbeddingRequest, option?: EmbeddingOption): Promise<EmbeddingResponse>;
  getMetadata(): Promise<EmbeddingModelMetadata>;
}
