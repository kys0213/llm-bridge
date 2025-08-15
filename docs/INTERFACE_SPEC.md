# Interface Specification

This document provides a comprehensive overview of the core interfaces defined in the `llm-bridge-spec` package.

## Core Bridge Interface

### LlmBridge

The main interface that all LLM providers must implement:

```typescript
export interface LlmBridge {
  // Core methods (required)
  invoke(prompt: LlmBridgePrompt): Promise<LlmBridgeResponse>;
  invoke(prompt: LlmBridgePrompt, option: InvokeOption): Promise<LlmBridgeResponse>;

  // Streaming support (optional)
  invokeStream?(prompt: LlmBridgePrompt): AsyncIterable<LlmBridgeResponse>;
  invokeStream?(prompt: LlmBridgePrompt, option: InvokeOption): AsyncIterable<LlmBridgeResponse>;

  // Metadata and capabilities (required)
  getMetadata(): Promise<LlmMetadata>;
  getCapabilities?(): Promise<LlmBridgeCapabilities>;
  getUsage?(): Promise<LlmUsage>;
}
```

### LlmBridgePrompt

Request structure for LLM interactions:

```typescript
export interface LlmBridgePrompt {
  messages: Message[];
}
```

### LlmBridgeResponse

Response structure from LLM:

```typescript
export interface LlmBridgeResponse {
  content: MultiModalContent;
  usage?: LlmUsage;
  toolCalls?: ToolCall[];
}
```

### InvokeOption

Options for customizing LLM behavior:

```typescript
export interface InvokeOption {
  tools?: LlmBridgeTool[]; // Available tools
  topP?: number; // Top-p sampling (0.0 ~ 1.0)
  topK?: number; // Top-k sampling
  temperature?: number; // Randomness (0.0 ~ 2.0)
  maxTokens?: number; // Maximum tokens to generate
  frequencyPenalty?: number; // Frequency penalty
  presencePenalty?: number; // Presence penalty
  stopSequence?: string[]; // Stop sequences
  historyCompression?: boolean; // History compression
}
```

## Message Types

### Base Message Types

```typescript
export type Message = UserMessage | AssistantMessage | SystemMessage | ToolMessage;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
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

export interface ToolMessage {
  role: 'tool';
  name: string;
  content: MultiModalContent[];
  toolCallId: string;
}
```

## Content Types

### MultiModal Content Support

```typescript
export type MultiModalContent =
  | StringContent
  | ImageContent
  | AudioContent
  | VideoContent
  | FileContent;

export interface StringContent {
  contentType: 'text';
  value: string;
}

export interface ImageContent {
  contentType: 'image';
  value: Buffer | Readable;
}

export interface AudioContent {
  contentType: 'audio';
  value: Buffer | Readable;
}

export interface VideoContent {
  contentType: 'video';
  value: Buffer | Readable;
}

export interface FileContent {
  contentType: 'file';
  value: Buffer | Readable;
}
```

## Manifest and Capabilities

### LlmManifest

Bridge configuration and metadata:

```typescript
export interface LlmManifest {
  schemaVersion: string; // Schema version
  name: string; // Bridge name
  language: string; // Implementation language
  entry: string; // Entry point file path
  configSchema: JSONObjectSchema; // Configuration schema
  capabilities: LlmBridgeCapabilities; // Supported features
  models: LlmModelInfo[]; // Supported models and pricing
  description: string; // Bridge description
}
```

### LlmBridgeCapabilities

Supported features and modalities:

```typescript
export interface LlmBridgeCapabilities {
  modalities: ContentType[]; // Supported content types
  supportsToolCall: boolean; // Tool calling support
  supportsFunctionCall: boolean; // Function calling support
  supportsMultiTurn: boolean; // Multi-turn conversation support
  supportsStreaming: boolean; // Streaming response support
  supportsVision: boolean; // Vision/image processing support
}
```

### LlmModelPricing

Cost information per model:

```typescript
export interface LlmModelPricing {
  unit: number; // Token unit basis (e.g., per 1000 tokens)
  currency: string; // Currency code
  prompt: number; // Prompt cost per unit
  completion: number; // Completion cost per unit
}
```

### LlmModelInfo

Model metadata with pricing:

```typescript
export interface LlmModelInfo {
  name: string; // Model name or ID
  contextWindowTokens: number; // Maximum context window size in tokens
  pricing: LlmModelPricing; // Cost information
}
```

Example `models` entry:

```json
{
  "name": "gpt-4o",
  "contextWindowTokens": 128000,
  "pricing": {
    "unit": 1000,
    "currency": "USD",
    "prompt": 0.005,
    "completion": 0.015
  }
}
```

## Tool Support

### Tool Definitions

```typescript
export interface LlmBridgeTool {
  name: string;
  description: string;
  parameters: JSONSchema;
}

export interface ToolCall {
  toolCallId: string;
  name: string;
  arguments: Record<string, any>;
}
```

## Metadata and Usage

### LlmMetadata

Bridge metadata information:

```typescript
export interface LlmMetadata {
  name: string;
  version: string;
  provider: string;
  model: string;
  [key: string]: any; // Additional metadata
}
```

### LlmUsage

Token usage information:

```typescript
export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

## JSON Schema Support

For configuration validation:

```typescript
export type JSONSchema = {
  $schema?: string;
  $id?: string;
  type?: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: string[];
  default?: any;
  description?: string;
  [key: string]: any;
};

export type JSONObjectSchema = {
  type: 'object';
  properties: Record<string, JSONSchema>;
  required?: string[];
  default?: any;
  description?: string;
};
```

## Type Utilities

```typescript
export type ContentType = MultiModalContent['contentType'];
```

---

For complete type definitions and implementation details, refer to the source code in `packages/llm-bridge-spec/src/`.
