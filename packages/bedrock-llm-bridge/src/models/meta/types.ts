/**
 * Meta 요청 메시지 타입
 */
export interface MetaMessage {
  role: string;
  content: string;
  images?: Buffer[];
}

/**
 * Meta API 요청 본문 타입
 */
export interface MetaRequestBody {
  messages: MetaMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop_sequences?: string[];
}

/**
 * Meta API 응답 본문 타입
 */
export interface MetaResponseBody {
  generation?: string;
  output?: string;
}
