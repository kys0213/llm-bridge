# 🎉 모든 LLM Bridge 통일된 사용법!

## 🚀 완전히 동일한 패턴

이제 **모든 브릿지**가 동일한 방식으로 사용됩니다!

### 1. OpenAI Bridge

```typescript
import OpenAIBridge from 'openai-llm-bridge';

const openai = OpenAIBridge.create({
  apiKey: 'sk-xxx',
  model: 'gpt-4o',
});

const openaiInfo = OpenAIBridge.manifest();
```

### 2. Bedrock Bridge

```typescript
import BedrockBridge from 'bedrock-llm-bridge';

const bedrock = BedrockBridge.create({
  region: 'us-east-1',
  modelId: 'anthropic.claude-3-haiku',
});

const bedrockInfo = BedrockBridge.manifest();
```

### 3. Llama3 Bridge

```typescript
import Llama3Bridge from 'llama3-llm-bridge';

const llama3 = Llama3Bridge.create({
  host: 'http://localhost:11434',
  model: 'llama3.2',
});

const llama3Info = Llama3Bridge.manifest();
```

### 4. Gemma3n Bridge

```typescript
import Gemma3nBridge from 'gemma3n-llm-bridge';

const gemma3n = Gemma3nBridge.create({
  host: 'http://localhost:11434',
  model: 'gemma3n:latest',
});

const gemma3nInfo = Gemma3nBridge.manifest();
```

## 🎯 일관된 패턴의 장점

### 1. 학습 용이성

- 한 번 배우면 모든 브릿지 사용 가능
- 새로운 브릿지도 즉시 이해

### 2. 개발 속도

- 복사-붙여넣기로 빠른 전환
- 일관된 API로 실수 방지

### 3. 유지보수성

- 모든 브릿지가 동일한 구조
- 공통 로직의 중앙 관리

## 🔄 브릿지 전환이 쉬워짐

```typescript
// 설정만 바꾸면 브릿지 전환 완료!
function createBridge(provider: 'openai' | 'bedrock' | 'llama3' | 'gemma3n') {
  switch (provider) {
    case 'openai':
      return OpenAIBridge.create({ apiKey: 'xxx' });
    case 'bedrock':
      return BedrockBridge.create({ region: 'us-east-1' });
    case 'llama3':
      return Llama3Bridge.create({ host: 'localhost:11434' });
    case 'gemma3n':
      return Gemma3nBridge.create({ host: 'localhost:11434' });
  }
}

// 모든 브릿지가 동일한 인터페이스!
const bridge = createBridge('openai');
await bridge.invoke(prompt);
```

## 🎊 SDK의 성과

✅ **4개 브릿지 모두 통일됨**
✅ **3줄로 브릿지 정의 완성**
✅ **100% 일관된 사용법**
✅ **완전한 타입 안전성**
✅ **기존 코드 호환성 유지**
