# openai-like-llm-bridge

OpenAI-compatible LLM bridge that targets providers exposing the OpenAI Chat Completions API (e.g., vLLM, LM Studio, LocalAI, OpenRouter).

## Install

```bash
pnpm add openai-like-llm-bridge llm-bridge-spec zod
```

## Quick Start

```ts
import OpenaiLikeBridge from 'openai-like-llm-bridge';

const bridge = OpenaiLikeBridge.create({
  baseUrl: 'http://localhost:8000/v1',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-3.5-turbo',
});

const res = await bridge.invoke({
  messages: [{ role: 'user', content: [{ contentType: 'text', value: 'Hello' }] }],
});

console.log(res.content);
```

## Notes

- Uses native `fetch` (Node 22+).
- Streaming via SSE is supported when the backend supports `stream: true`.
- Text modality supported in v1; multimodal can be extended later.
