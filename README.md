# LLM Bridge

LLM Bridge는 다양한 LLM(Large Language Model) 서비스를 통합하고 관리하기 위한 도구입니다.

## 프로젝트 구조

이 프로젝트는 pnpm 모노레포로 구성되어 있으며, 다음과 같은 패키지들로 이루어져 있습니다:

- `llm-bridge-loader`: LLM 서비스 로더 및 통합 관리
- `llm-bridge-spec`: LLM 서비스 스펙 정의 및 타입
- `llama3-with-ollama-llm-bridge`: Ollama 기반 Llama3 브릿지
- `gemma3n-with-ollama-llm-bridge`: Ollama 기반 Gemma 3n 브릿지
- `llama3-with-bedrock-llm-bridge`: Bedrock 기반 Llama3 브릿지
- `openai-gpt4-llm-bridge`: OpenAI GPT-4 브릿지
- `bedrock-anthropic-llm-bridge`: Amazon Bedrock Anthropic 브릿지

## 요구사항

- Node.js 22.0.0 이상
- pnpm 8.0.0 이상

## 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/llm-bridge.git
cd llm-bridge

# 의존성 설치
pnpm install
```

## 개발

```bash
# 모든 패키지 빌드
pnpm build

# 특정 패키지 빌드
 pnpm --filter llm-bridge-loader build
 pnpm --filter llm-bridge-spec build

# 테스트 실행
pnpm test

# 린트 검사
pnpm lint

# 린트 검사 및 자동 수정
pnpm lint:fix

# 코드 포맷팅
pnpm format
```

## 패키지 설명

### llm-bridge-loader

- 아직 MVP 구현체입니다.

LLM 서비스를 로드하고 관리하는 핵심 패키지입니다.

```typescript
import { OLLAMA_LLAMA3_MANIFEST } from 'llama3-llm-bridge';

const { manifest, ctor, configSchema } = await LlmBridgeLoader.load<typeof OLLAMA_LLAMA3_MANIFEST>('llama3-with-ollama-llm-bridge');

// manifest 의 configSchema 에 따라 cli/gui 로 추가 입력정보를 받아야함.
// 호스트와 모델을 설정하여 브릿지를 생성
const bridge = new ctor({
  host: 'http://localhost:11434',
  model: 'llama3.2',
});

// 입력된 값을 유효성검증
configSchema.parse(...)

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

### llm-bridge-spec

LLM 서비스의 스펙과 타입을 정의하는 패키지입니다.

### Bridge Loader

LLM 브릿지를 로드하는 인터페이스 정의는 `docs/BRIDGE_LOADER_SPEC.md` 문서를 참고하세요.

## 라이선스

MIT

## 기여하기

1. 이 저장소를 포크합니다.
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.
