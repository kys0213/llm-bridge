# openai-like-llm-bridge 계획서

## 목표

- OpenAI Chat Completions API 스펙을 준수하는 “호환” 브리지 패키지 제공
- vLLM, Oobabooga, LM Studio, LocalAI, OpenRouter 등 OpenAI-호환 REST 엔드포인트를 단일 브리지로 지원
- 기존 `openai-llm-bridge`는 OpenAI 공식 SDK/스펙 최적화 유지, 본 패키지는 범용 호환성에 집중

## 설계 원칙

- llm-bridge-spec 인터페이스(LlmBridge) 충실 구현
- 엔트리: SDK.createBridgePackage 기반 default export 제공(로더 호환)
- 의존성 최소화: 기본 `fetch`(Node 22+) 사용, 별도 SDK 무의존
- 설정으로 엔드포인트/헤더를 유연하게 주입하여 다양한 호환 서버 대응

## 패키지 구조

```
packages/openai-like-llm-bridge/
├── src/
│   ├── bridge/
│   │   ├── openai-like-bridge.ts
│   │   ├── openai-like-factory.ts
│   │   └── openai-like-manifest.ts
│   ├── __tests__/
│   │   ├── prompt-mapping.test.ts
│   │   └── streaming-parse.test.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── tsconfig.esm.json
├── tsconfig.cjs.json
├── vitest.config.ts
└── README.md
```

## 구성 스키마(초안)

- baseUrl: string (예: http://localhost:8000/v1)
- apiKey: string | env(`OPENAI_API_KEY`) fallback(optional)
- model: string
- temperature?: number
- top_p?: number
- max_tokens?: number
- timeoutMs?: number (기본 60_000)
- headers?: Record<string, string> (추가 사용자 헤더)
- organization?: string (OpenAI 호환 필드)
- compatibility?: {
  - strict?: boolean (엄격 파싱/필수 필드 강제)
  - streamDeltaMode?: 'text' | 'content-part' (스트림 델타 해석 방식)
    }

JSON Schema/Zod로 정의하여 매니페스트에 포함.

## Bridge 구현

- 클래스: `OpenaiLikeBridge implements LlmBridge`
- invoke(prompt, option?):
  - llm-bridge-spec의 `LlmBridgePrompt` → OpenAI Chat Completions 요청 바디로 매핑
  - 멀티모달 텍스트 우선 지원(이미지 등은 지원 서버 제한 고려, v1은 텍스트/JSON 중심)
  - fetch(baseUrl + '/chat/completions') POST, Authorization: `Bearer ${apiKey}`
  - 응답을 `LlmBridgeResponse`로 매핑: content, usage, toolCalls 등(지원 시)
- invokeStream(prompt, option?):
  - `stream: true`로 요청, SSE(chunked) 응답을 라인 단위(`data:`) 파싱
  - delta 처리: `choices[].delta.content` 누적 → 증분 `LlmBridgeResponse` 발행
  - 스트림 종료 신호(`[DONE]`) 처리
- 에러 처리:
  - HTTP status != 2xx → 에러 매핑(메시지, code, type)
  - JSON 파싱/프로토콜 오류 → 명확한 오류 메시지와 cause 포함

## 매니페스트

- schemaVersion: '1.0.0'
- name: 'openai-like-llm-bridge'
- language: 'typescript'
- entry: 'src/bridge/openai-like-bridge.ts'
- configSchema: 위 Zod 스키마(JSON Schema 변환 가능)
- capabilities(초안):
  - messages: true
  - streaming: true
  - json_output: true
  - tool_calls: optional(true/false) — 초기 false, 추후 확장
- description: 'OpenAI-compatible chat completions bridge for multiple providers'

## 엔트리 포인트

```ts
export default SDK.createBridgePackage({
  bridge: OpenaiLikeBridge,
  factory: createOpenaiLikeBridge,
  manifest: OPENAI_LIKE_MANIFEST,
});
```

## 프롬프트/응답 매핑

- 요청 매핑:
  - spec Message → OpenAI roles('system'|'user'|'assistant'|'tool')와 content
  - 텍스트 이외 파트는 v1 제외 또는 `strict=false`일 때 best-effort 변환
  - 옵션 매핑: temperature/top_p/max_tokens 등 전달
- 응답 매핑:
  - `choices[0].message.content` → `MultiModalContent`(텍스트로 래핑)
  - usage: prompt_tokens, completion_tokens, total_tokens 매핑
  - toolCalls: 추후 지원 시 OpenAI function/tool_calls를 공용 타입으로 변환

## 테스트 전략

- 단위 테스트(Unit)
  - 프롬프트 → 요청 바디 변환 검증
  - 응답(JSON) → `LlmBridgeResponse` 변환 검증
  - SSE 스트림 라인 파서: 델타 누적/종료 처리
- E2E(옵션, CI 제외)
  - 로컬 vLLM/호환 서버에 대한 간단 호출 스모크

## 패키지 설정

- 듀얼 패키지(CJS/ESM), `exports` 루트 노출, `types` 일치
- `files`: ["dist", "esm", "README.md"], `sideEffects: false`
- peerDependencies: `llm-bridge-spec`, `zod`
- dependencies: 기본적으로 없음(fetch 사용)

## 마이그레이션/사용 가이드

- vLLM 등 호환 서버 예시:

```ts
import OpenaiLikeBridge from 'openai-like-llm-bridge';
const bridge = OpenaiLikeBridge.create({
  baseUrl: 'http://localhost:8000/v1',
  apiKey: process.env.OPENAI_API_KEY ?? 'sk-...',
  model: 'gpt-3.5-turbo',
});
const res = await bridge.invoke({
  messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
});
```

## 일정/TODO

1. 스캐폴딩(구조/설정/패키지) [TODO 1/6]
2. Config 스키마/타입 정의 [TODO 2/6]
3. Bridge 구현(invoke/invokeStream) [TODO 3/6]
4. Manifest 구현 [TODO 4/6]
5. 테스트 추가(Unit, E2E 스킵) [TODO 5/6]
6. 문서/README 작성 [TODO 6/6]

## 리스크 및 완화

- 서버별 미세한 차이(필드/에러 형식): strict/loose 모드로 파싱 완화
- 스트리밍 파서 호환성: 샘플 로그 기반 파서 유닛 테스트 강화
- 멀티모달 제한: 1차 릴리스 텍스트 우선, 추후 확장 명시
