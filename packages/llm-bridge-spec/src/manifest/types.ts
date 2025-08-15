/**
 * LLM의 기능 지원 정보입니다.
 */

import { ContentType } from '../message/types';
import { ZodObject } from 'zod';

export interface LlmBridgeCapabilities {
  modalities: ContentType[];
  supportsToolCall: boolean;
  supportsFunctionCall: boolean;
  supportsMultiTurn: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
}

/**
 * 모델별 가격 정보입니다.
 */
export interface LlmModelPricing {
  unit: number;
  currency: string;
  prompt: number;
  completion: number;
}

/**
 * LLM 모델 정보입니다.
 */
export interface LlmModelInfo {
  name: string;
  /** 최대 컨텍스트 윈도우 크기(토큰 단위) */
  contextWindowTokens: number;
  pricing: LlmModelPricing;
}

/**
 * LLM 매니페스트 정보입니다.
 */
export interface LlmManifest {
  /** 스키마 버전 */
  schemaVersion: string;
  /** LLM 이름 */
  name: string;
  /** 구현 언어 */
  language: string;
  /** 진입점 파일 경로 */
  entry: string;
  /** 설정 스키마 */
  configSchema: ZodObject;
  /** 지원 기능 정보 */
  capabilities: LlmBridgeCapabilities;
  /** 지원 모델 정보 */
  models: LlmModelInfo[];
  /** LLM 설명 */
  description: string;
}
