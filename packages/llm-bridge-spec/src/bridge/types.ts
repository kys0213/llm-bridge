import { LlmBridgeCapabilities } from '../manifest/types';
import { ChatMessage, MultiModalContent } from '../message/types';

/**
 * LLM 브릿지의 핵심 인터페이스입니다.
 * 모든 LLM 제공자는 이 인터페이스를 구현해야 합니다.
 */
export interface LlmBridge {
  /**
   * LLM에 프롬프트를 전송하고 응답을 받습니다.
   * @param prompt - 전송할 프롬프트 메시지
   * @param option - 채팅 옵션 설정
   * @returns LLM의 응답
   */
  invoke(prompt: LlmBridgePrompt): Promise<LlmBridgeResponse>;
  invoke(prompt: LlmBridgePrompt, option: InvokeOption): Promise<LlmBridgeResponse>;

  /**
   * LLM에 프롬프트를 전송하고 스트리밍 응답을 받습니다.
   * @param prompt - 전송할 프롬프트 메시지
   * @param option - 채팅 옵션 설정
   * @returns 스트리밍 응답의 AsyncIterable
   */
  invokeStream?(prompt: LlmBridgePrompt): AsyncIterable<LlmBridgeResponse>;
  invokeStream?(prompt: LlmBridgePrompt, option: InvokeOption): AsyncIterable<LlmBridgeResponse>;

  /**
   * LLM의 메타데이터를 조회합니다.
   * @returns LLM의 메타데이터
   */
  getMetadata(): Promise<LlmMetadata>;

  /**
   * LLM의 기능 지원 여부를 조회합니다.
   * @returns LLM의 기능 지원 정보
   */
  getCapabilities?(): Promise<LlmBridgeCapabilities>;

  /**
   * LLM의 사용량 정보를 조회합니다.
   * @returns 토큰 사용량 정보
   */
  getUsage?(): Promise<LlmUsage>;
}

/**
 * LLM 채팅 요청에 대한 옵션 설정입니다.
 */
export interface InvokeOption {
  /** 사용 가능한 도구 목록 */
  tools?: LlmBridgeTool[];

  /** 상위 확률 분포의 임계값 (0.0 ~ 1.0) */
  topP?: number;

  /** 상위 K개의 토큰만 고려 */
  topK?: number;

  /** 응답의 무작위성 정도 (0.0 ~ 2.0) */
  temperature?: number;

  /** 최대 생성 토큰 수 */
  maxTokens?: number;

  /** 빈도 페널티 (중복 방지) */
  frequencyPenalty?: number;

  /** 존재 페널티 (다양성 증가) */
  presencePenalty?: number;

  /** 생성 중단 시퀀스 */
  stopSequence?: string[];

  /** 대화 이력 압축 사용 여부 */
  historyCompression?: boolean;
}

/**
 * LLM에 전송할 프롬프트 구조입니다.
 */
export interface LlmBridgePrompt {
  /** 대화 메시지 목록 */
  messages: ChatMessage[];
}

/**
 * LLM의 응답 구조입니다.
 */
export interface LlmBridgeResponse {
  /** 응답 내용 */
  content: MultiModalContent;
  /** 토큰 사용량 정보 */
  usage?: LlmUsage;
  /** 도구 호출 결과 */
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  /** 도구 호출 식별자 */
  toolCallId: string;
  /** 도구 이름 */
  name: string;
  /** 도구 인자 */
  arguments: Record<string, unknown>;
}

/**
 * LLM의 토큰 사용량 정보입니다.
 */
export interface LlmUsage {
  /** 입력 프롬프트의 토큰 수 */
  promptTokens: number;
  /** 생성된 응답의 토큰 수 */
  completionTokens: number;
  /** 전체 토큰 수 */
  totalTokens: number;
}

/**
 * LLM에서 사용 가능한 도구의 정의입니다.
 */
export interface LlmBridgeTool {
  /** 도구 이름 */
  name: string;
  /** 도구 설명 */
  description: string;
  /** 도구 파라미터 스키마 */
  parameters: Record<string, unknown>;
  /** 도구 응답 스키마 */
  response: Record<string, unknown>;
}

/**
 * LLM의 메타데이터 정보입니다.
 */
export interface LlmMetadata extends Record<string, unknown> {
  /** LLM 아이콘 URL */
  icon?: string;
  /** LLM 이름 */
  name: string;
  /** LLM 버전 */
  version: string;
  /** LLM 설명 */
  description: string;
  /** 사용 중인 모델명 */
  model: string;
  /** 컨텍스트 윈도우 크기 (토큰) */
  contextWindow: number;
  /** 최대 생성 토큰 수 */
  maxTokens: number;
}
