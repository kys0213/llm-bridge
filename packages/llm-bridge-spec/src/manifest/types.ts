/**
 * LLM의 기능 지원 정보입니다.
 */

import { ContentType } from '../message/types';

export interface LlmBridgeCapabilities {
  modalities: ContentType[];
  supportsToolCall: true;
  supportsFunctionCall: true;
  supportsMultiTurn: true;
  supportsStreaming: true;
  supportsVision: true;
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
  configSchema: JSONObjectSchema;
  /** 지원 기능 정보 */
  capabilities: LlmBridgeCapabilities;
  /** LLM 설명 */
  description: string;
}
/**
 * JSON 스키마 타입 정의입니다.
 */
export type JSONSchema = {
  /** 스키마 버전 */
  $schema?: string;
  /** 스키마 ID */
  $id?: string;
  /** 데이터 타입 */
  type?: string;
  /** 객체 속성 정의 */
  properties?: Record<string, JSONSchema>;
  /** 배열 아이템 스키마 */
  items?: JSONSchema;
  /** 필수 속성 목록 */
  required?: string[];
  /** 열거형 값 목록 */
  enum?: string[];
  /** 기본값 */
  default?: any;
  /** 설명 */
  description?: string;
  /** 추가 속성 */
  [key: string]: any;
};

export type JSONObjectSchema = {
  type: 'object';
  properties: Record<string, JSONSchema>;
  required?: string[];
  /** 기본값 */
  default?: any;
  /** 설명 */
  description?: string;
};
