# openai-embedding-bridge

OpenAI Embedding Bridge 구현체입니다.

## 설치

```bash
pnpm add openai-embedding-bridge
```

## 사용 예시

```ts
import { createOpenAIEmbeddingBridge } from 'openai-embedding-bridge';

const bridge = createOpenAIEmbeddingBridge({ apiKey: 'sk-...', model: 'text-embedding-3-small' });
```
