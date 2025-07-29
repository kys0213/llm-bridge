/**
 * Anthropic 요청 콘텐츠 타입들
 */
export type AnthropicContentType = 'text' | 'image';

export interface AnthropicTextContent {
  type: 'text';
  text: string;
}

export interface AnthropicImageContent {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
    data: string;
  };
}

export type AnthropicContent = AnthropicTextContent | AnthropicImageContent;

/**
 * Anthropic 요청 메시지 타입
 */
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: AnthropicContent[];
}

/**
 * Anthropic 도구 정의 타입들
 */
export interface AnthropicCustomTool {
  type?: 'custom';
  name: string;
  description?: string;
  input_schema: Record<string, any>;
}

export interface AnthropicComputerTool {
  type: string;
  name: 'computer';
  display_height_px: number;
  display_width_px: number;
  display_number?: number;
}

export interface AnthropicBashTool {
  type?: string;
  name: 'bash';
}

export interface AnthropicTextEditorTool {
  type?: string;
  name: 'str_replace_editor';
}

export type AnthropicTool =
  | AnthropicCustomTool
  | AnthropicComputerTool
  | AnthropicBashTool
  | AnthropicTextEditorTool;

/**
 * Anthropic 도구 선택 타입
 */
export interface AnthropicToolChoice {
  type: 'any' | 'auto' | 'tool';
  name?: string; // required when type is 'tool'
}

/**
 * Anthropic API 요청 본문 타입 (AWS Bedrock용)
 */
export interface AnthropicRequestBody {
  anthropic_version: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
  anthropic_beta?: string[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  tools?: AnthropicTool[];
  tool_choice?: AnthropicToolChoice;
  stop_sequences?: string[];
}

export interface AnthropicToolUseContent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

export type AnthropicResponseContent = AnthropicContent | AnthropicToolUseContent;

/**
 * Anthropic 응답 중단 이유 타입
 */
export type AnthropicStopReason = 'end_turn' | 'max_tokens' | 'stop_sequence';

/**
 * Anthropic API 응답 본문 타입 (AWS Bedrock용)
 */
export interface AnthropicResponseBody {
  id: string;
  model: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicResponseContent[];
  stop_reason: AnthropicStopReason;
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
