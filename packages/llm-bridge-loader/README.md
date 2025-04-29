# @llm-bridge/llm-bridge-loader

LLM 서비스를 로드하고 관리하는 핵심 패키지입니다.

## 설치

```bash
npm install @llm-bridge/llm-bridge-loader
# or
yarn add @llm-bridge/llm-bridge-loader
# or
pnpm add @llm-bridge/llm-bridge-loader
```

## 사용법

```typescript
import { LlmBridgeLoader } from '@llm-bridge/llm-bridge-loader';

// LLM 서비스 로드
const { manifest, ctor, configSchema } = await LlmBridgeLoader.load('@llm-bridge/llama3-with-ollama');

// manifest의 configSchema에 따라 cli/gui로 추가 입력정보를 받아야 함
const bridge = new ctor();

// 입력된 값을 유효성 검증
configSchema.parse(...);

// LLM 서비스 호출
const response = await bridge.invoke({
  messages: [
    {
      role: 'user',
      content: {
        contentType: 'text',
        value: 'Hello, world!',
      },
    },
  ],
});

console.log(response);
```

## API

### `LlmBridgeLoader.load(moduleName: string)`

지정된 모듈 이름으로 LLM 서비스를 로드합니다.

#### 매개변수

- `moduleName`: 로드할 LLM 서비스 모듈의 이름

#### 반환값

- `manifest`: LLM 서비스의 메타데이터
- `ctor`: LLM 서비스의 생성자 함수
- `configSchema`: LLM 서비스의 설정 스키마

## 라이선스

MIT 