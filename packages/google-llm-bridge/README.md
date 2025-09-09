# Google LLM Bridge

Google Gemini 기반 LLM 브릿지 구현체로, 공통 LLM Bridge 인터페이스를 통해 Google Generative AI 모델을 사용할 수 있도록 합니다.

## 설치

```bash
pnpm add google-llm-bridge llm-bridge-spec @google/generative-ai zod
```

## 사용 예시

```typescript
import { createGoogleAIBridge, GoogleModelEnum } from 'google-llm-bridge';

const bridge = createGoogleAIBridge({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: GoogleModelEnum.GEMINI_1_5_FLASH,
});

const res = await bridge.invoke({
  messages: [{ role: 'user', content: [{ contentType: 'text', value: 'hello' }] }],
});

console.log(res.content.value);
```

## 지원 모델

지원되는 모델과 스펙은 [docs/models.md](./docs/models.md) 문서를 참고하세요.
