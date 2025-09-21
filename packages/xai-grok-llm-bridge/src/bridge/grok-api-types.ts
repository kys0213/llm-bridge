export type GrokTextMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | GrokContentPart[];
};

export type GrokToolMessage = {
  role: 'tool';
  tool_call_id: string;
  content: string;
};

export type GrokMessage = GrokTextMessage | GrokToolMessage;

export type GrokContentPart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image_url';
      image_url: {
        url: string;
      };
    };

export type GrokToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type GrokResponseFormat =
  | { type: 'text' }
  | { type: 'json_object' }
  | {
      type: 'json_schema';
      json_schema: {
        name: string;
        schema: Record<string, unknown>;
        strict?: boolean;
      };
    };

export type GrokChatCompletionRequest = {
  model: string;
  messages: GrokMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  tools?: GrokToolDefinition[];
  tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
  parallel_tool_calls?: boolean;
  response_format?: GrokResponseFormat;
  reasoning_effort?: 'low' | 'high';
  search_parameters?: Record<string, unknown>;
  user?: string;
  conversation_id?: string;
  store_messages?: boolean;
  previous_response_id?: string;
  stream?: boolean;
  stream_options?: Record<string, unknown>;
  seed?: number;
};

export type GrokToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

export type GrokChatChoice = {
  index?: number;
  message?: {
    role?: string;
    content?: string | null;
    reasoning_content?: string | null;
    tool_calls?: GrokToolCall[] | null;
  };
  delta?: {
    content?: string | null;
    reasoning_content?: string | null;
    tool_calls?: GrokToolCall[] | null;
  };
  finish_reason?: string | null;
};

export type GrokUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: {
    reasoning_tokens?: number | null;
  } | null;
};

export type GrokChatCompletionResponse = {
  choices?: GrokChatChoice[];
  usage?: GrokUsage;
  citations?: string[] | null;
};

export type GrokChatCompletionChunk = {
  choices?: GrokChatChoice[];
  usage?: GrokUsage | null;
  citations?: string[] | null;
};

export type SseEvent = {
  event?: string;
  data?: string;
};
