# xAI Grok LLM Bridge

xAI Grok LLM Bridge는 xAI Grok Chat Completions API를 `llm-bridge-spec` 인터페이스에 맞춰 래핑한 패키지입니다.

## 설치

```bash
pnpm add xai-grok-llm-bridge
```

## 사용 예시

```ts
import GrokBridgePkg from 'xai-grok-llm-bridge';

const bridge = new GrokBridgePkg.bridge({
  apiKey: process.env.XAI_API_KEY!,
  baseUrl: 'https://api.x.ai/v1',
  model: 'grok-3-latest',
});

const response = await bridge.invoke({
  messages: [
    { role: 'user', content: [{ contentType: 'text', value: '안녕?' }] },
  ],
});

console.log(response.content);
```
