# 인터페이스 스펙 요약

`llm-bridge-spec` 패키지에서 정의한 주요 인터페이스를 간략히 소개합니다.

## LlmBridge

```typescript
export interface LlmBridge {
  chat(prompt: LlmBridgePrompt, option: ChatOption): Promise<LlmBridgeResponse>;
  chatStream?(prompt: LlmBridgePrompt, option: ChatOption): AsyncIterable<LlmBridgeResponse>;
  getMetadata(): Promise<LlmMetadata>;
}
```

## LlmBridgePrompt

```typescript
export interface LlmBridgePrompt {
  messages: ChatMessage[];
}
```

## ChatOption

```typescript
export interface ChatOption {
  tools?: LlmBridgeTool[];
  historyCompression?: boolean;
}
```

이 외의 자세한 타입 정의는 `packages/llm-bridge-spec` 패키지의 소스코드를 참고하세요.

