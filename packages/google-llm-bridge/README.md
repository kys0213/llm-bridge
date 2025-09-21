# Google LLM Bridge

Google Generative AI(Gemini)와 `llm-bridge-spec` 공통 인터페이스를 연결하는 어댑터입니다. 모델, 가격, 컨텍스트 정보와 생성 옵션을 한곳에서 관리하여 새 모델이 추가되더라도 최소한의 수정으로 확장할 수 있습니다.

## 주요 특징

- **타입 안전한 설정**: `GoogleModelEnum`과 Zod 스키마로 모델과 옵션을 검증하고 기본값을 제공합니다.
- **풍부한 생성 옵션**: 토큰 한도, 샘플링 파라미터, JSON 응답 스키마, Safety 설정 등을 그대로 전달합니다.
- **도구 호출 & 스트리밍 지원**: Gemini Function Calling 응답을 `toolCalls`로 변환하고, 스트림 모드에서도 증분 텍스트와 사용량을 순차적으로 제공합니다.
- **일관된 메타데이터**: 컨텍스트 윈도우, 출력 토큰 한도, 가격 정보를 중앙에서 관리하고 매니페스트·문서와 연동합니다.

## 설치

```bash
pnpm add google-llm-bridge llm-bridge-spec @google/generative-ai zod
```

## 빠른 시작

```typescript
import { createGoogleAIBridge, GoogleModelEnum } from 'google-llm-bridge';

const bridge = createGoogleAIBridge({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: GoogleModelEnum.GEMINI_1_5_FLASH,
  temperature: 0.4,
  maxOutputTokens: 2048,
  safetySettings: [{ category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' }],
});

const response = await bridge.invoke({
  messages: [
    { role: 'system', content: [{ contentType: 'text', value: 'You are a concise assistant.' }] },
    { role: 'user', content: [{ contentType: 'text', value: '서울 날씨를 알려줘.' }] },
  ],
  tools: [
    {
      name: 'getWeather',
      description: 'Retrieve the weather forecast',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
    },
  ],
});

console.log(response.content.value);
if (response.toolCalls?.length) {
  console.log('tool call arguments:', response.toolCalls[0].arguments);
}
```

## 스트리밍 사용 예시

```typescript
const stream = bridge.invokeStream({
  messages: [
    { role: 'user', content: [{ contentType: 'text', value: '10줄 이내로 자기소개해줘' }] },
  ],
});

for await (const chunk of stream) {
  if (chunk.content.value) {
    process.stdout.write(chunk.content.value);
  }
}
```

## 설정 옵션 요약

| 옵션                                                 | 설명                                                  |
| ---------------------------------------------------- | ----------------------------------------------------- |
| `model`                                              | `GoogleModelEnum` 중 하나 (기본값 `gemini-1.5-flash`) |
| `temperature`, `topP`, `topK`                        | 샘플링 파라미터                                       |
| `maxOutputTokens`, `stopSequences`, `candidateCount` | 출력 제어 옵션                                        |
| `responseMimeType`, `responseSchema`                 | JSON 출력 강제·스키마 정의                            |
| `presencePenalty`, `frequencyPenalty`                | 반복 억제 계수                                        |
| `safetySettings`                                     | Safety 필터 기준(카테고리/임계값)                     |

## 모델 스펙 문서

지원되는 모델과 최신 스펙은 [docs/models.md](./docs/models.md)에서 확인할 수 있습니다. 문서에 정리된 정보는 `google-models.ts`의 `MODEL_METADATA`를 기반으로 자동으로 유지됩니다.
