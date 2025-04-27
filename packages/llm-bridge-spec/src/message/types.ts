import { Readable } from 'stream';

export type Message = UserMessage | AssistantMessage | SystemMessage | ToolMessage;
/**
 * 대화 메시지의 기본 구조입니다.
 */

export interface ChatMessage {
  /** 메시지 작성자의 역할 */
  role: 'user' | 'assistant' | 'system';
  /** 메시지 내용 (다중 모달 지원) */
  content: MultiModalContent;
}

export interface UserMessage extends ChatMessage {
  role: 'user';
}

export interface AssistantMessage extends ChatMessage {
  role: 'assistant';
}

export interface SystemMessage extends ChatMessage {
  role: 'system';
}
/**
 * 도구 실행 결과 메시지 구조입니다.
 */

export interface ToolMessage {
  /** 도구 메시지 역할 (항상 'tool') */
  role: 'tool';
  /** 실행된 도구의 이름 */
  name: string;
  /** 도구 실행 결과 */
  content: string;
  /** 도구 호출 식별자 */
  toolCallId: string;
}
/**
 * 다중 모달 콘텐츠 타입 정의입니다.
 */

export type MultiModalContent =
  | StringContent
  | ImageContent
  | AudioContent
  | VideoContent
  | FileContent;
/**
 * 텍스트 콘텐츠 구조입니다.
 */

export interface StringContent {
  /** 콘텐츠 타입 (항상 'text') */
  contentType: 'text';
  /** 텍스트 내용 */
  value: string;
}
/**
 * 이미지 콘텐츠 구조입니다.
 */

export interface ImageContent {
  /** 콘텐츠 타입 (항상 'image') */
  contentType: 'image';
  /** 이미지 데이터 */
  value: Buffer | Readable;
}
/**
 * 오디오 콘텐츠 구조입니다.
 */

export interface AudioContent {
  /** 콘텐츠 타입 (항상 'audio') */
  contentType: 'audio';
  /** 오디오 데이터 */
  value: Buffer | Readable;
}
/**
 * 비디오 콘텐츠 구조입니다.
 */

export interface VideoContent {
  /** 콘텐츠 타입 (항상 'video') */
  contentType: 'video';
  /** 비디오 데이터 */
  value: Buffer | Readable;
}
/**
 * 파일 콘텐츠 구조입니다.
 */

export interface FileContent {
  /** 콘텐츠 타입 (항상 'file') */
  contentType: 'file';
  /** 파일 데이터 */
  value: Buffer | Readable;
}

export type ContentType = MultiModalContent['contentType'];
