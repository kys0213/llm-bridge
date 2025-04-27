# LLM Bridge Spec

LLM 모델을 표준화된 방식으로 연결하고 실행하기 위한 명세입니다.

## 🧭 1. 철학 (Philosophy)

### 핵심 철학

> **LLM 연결은 단순해야 한다.**
> 각 모델마다 제각각인 SDK나 API 구조에 묶이지 않고, 선언적이고 표준화된 방식으로 모델을 연결하고 실행할 수 있어야 한다.

### 설계 원칙

- **추상화의 균형**: Bridge는 LLM 연결만 담당하고, 프롬프트 최적화는 Agent 또는 사용자에게 맡긴다.
- **구현의 자유, 구조는 선언적으로**: Node.js, Python, CLI 등 다양한 방식으로 실행 가능하지만, config는 JSON 기반으로 통일
- **언어 독립성**: Node.js, Python, Java, Rust 등 어떤 언어에서도 구현 가능
- **입력 설정의 자동화**: `config.schema.json`을 기반으로 GUI/CLI에서 자동 입력 폼 구성 가능
- **작고 명확한 시작**: 큰 스펙보다 작지만 분명한 구조로 시작하여 선택받도록 한다

## 📋 2. 요구사항 (Requirements)

### 필수 구성 요소

- `bridge.manifest.json`: 브릿지 메타데이터 및 엔트리포인트 정의
- `config.schema.json`: JSON Schema 기반 입력 명세 정의
- 브릿지는 `chat()` 인터페이스를 반드시 구현해야 함 (선택적으로 `chatStream()`도 구현 가능)

### 기능 요구사항

| 항목                                  | 설명                                                   |
| ------------------------------------- | ------------------------------------------------------ |
| ✅ 선언적 구성                        | 모든 브릿지는 manifest + configSchema를 반드시 포함    |
| ✅ 다언어 지원                        | Node.js, Python, Java 등 다양한 언어로 구현 가능       |
| ✅ 독립 실행 가능                     | CLI, GUI, Agent에서 독립적으로 로딩 및 실행 가능       |
| ✅ Proxy, 인증은 bridge 내부에서 처리 | 표준에서는 schema만 정의하고 실제 처리는 구현체가 담당 |
| ✅ 프롬프트 최적화는 책임지지 않음    | 품질은 각 Agent 또는 사용자의 몫임                     |

## 🧩 3. 인터페이스 명세 (Interface Spec)

### `LlmBridge`

```typescript
export interface LlmBridge {
  chat(prompt: LlmBridgePrompt, option: ChatOption): Promise<LlmBridgeResponse>;
  chatStream?(prompt: LlmBridgePrompt, option: ChatOption): AsyncIterable<LlmBridgeResponse>;
  getMetadata(): Promise<LlmMetadata>;
  getCapabilities?(): Promise<LlmBridgeCapabilities>;
  getUsage?(): Promise<LlmUsage>;
}
```

### `LlmBridgePrompt`

```typescript
export interface LlmBridgePrompt {
  messages: ChatMessage[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: MultiModalContent;
}
```

### `ChatOption`

```typescript
export interface ChatOption {
  tools?: LlmBridgeTool[];
  historyCompression?: boolean;
}
```

### `LlmBridgeCapabilities`

```typescript
export interface LlmBridgeCapabilities {
  supportsStream: boolean;
  supportsTools: boolean;
  supportsUsage: boolean;
}
```

### `LlmManifest`

```typescript
export interface LlmManifest {
  schemaVersion: string;
  name: string;
  language: string;
  entry: string;
  configSchema: JSONSchema;
  capabilities: LlmBridgeCapabilities;
  description: string;
}
```

## 🚀 4. MVP 계획 (MVP Plan)

### ✅ 1단계: 작고 명확한 시작

- [ ] GitHub에 `llm-bridge-spec` 레포 공개
- [ ] 샘플 브릿지 (`@llm-bridge/openai-gpt4`) 포함
- [ ] `bridge.manifest.json`, `config.schema.json`, `bridge.ts` 포함

### ✅ 2단계: 자동 입력 CLI

- [ ] `loadBridgeAndRun.ts` 스크립트 제공
- [ ] schema → 입력 프롬프트 자동 생성

### ✅ 3단계: 레지스트리 & GUI

- [ ] 여러 브릿지를 등록 가능한 구조 설계
- [ ] React 기반 GUI에서 schema 기반 폼 자동 생성

### ✅ 4단계: 철학 정리 및 공개

- [ ] README에 철학 명시: "프롬프트는 Bridge가 최적화하지 않습니다"
- [ ] LinkedIn / Hacker News / Reddit 등에서 반응 확인

## ✨ 핵심 메시지

> **LLM Bridge는 프롬프트를 최적화하지 않습니다.**
> 단지 다양한 모델을 구조적으로 선언하고, 교체 가능한 구조를 제공할 뿐입니다.

모델 연결은 Bridge에 맡기고,
사용자 경험은 각 Agent에 맡기세요.

## 📦 설치 및 사용

```bash
# 패키지 설치
npm install @agentos/llm-bridge-spec

# 또는 yarn
yarn add @agentos/llm-bridge-spec

# 또는 pnpm
pnpm add @agentos/llm-bridge-spec
```

## 🤝 기여하기

1. 이슈 생성
2. 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
