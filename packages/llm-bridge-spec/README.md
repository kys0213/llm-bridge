# llm-bridge-spec

LLM 서비스의 스펙, 타입, 그리고 공통 에러 클래스를 정의하는 패키지입니다.

## 📋 목차

1. [개요](#개요)
2. [철학](#철학)
3. [설치](#설치)
4. [인터페이스 명세](#인터페이스-명세)
5. [에러 클래스](#에러-클래스)
6. [사용 예시](#사용-예시)
7. [기여하기](#기여하기)

## 🎯 개요

`llm-bridge-spec`은 다양한 LLM 서비스들을 통합하여 사용할 수 있도록 표준화된 인터페이스와 에러 처리 체계를 제공합니다.

### 주요 구성 요소

- **표준 인터페이스**: 모든 LLM 브릿지가 따라야 하는 공통 인터페이스
- **타입 정의**: TypeScript 타입 안전성을 보장하는 타입 시스템
- **에러 클래스**: 일관된 에러 처리를 위한 계층적 에러 클래스 체계
- **매니페스트 스펙**: 브릿지 메타데이터 및 설정 스키마 정의

## 🧭 철학

### 핵심 철학

> **LLM 연결은 단순해야 한다.**
> 각 모델마다 제각각인 SDK나 API 구조에 묶이지 않고, 선언적이고 표준화된 방식으로 모델을 연결하고 실행할 수 있어야 한다.

### 설계 원칙

- **추상화의 균형**: Bridge는 LLM 연결만 담당하고, 프롬프트 최적화는 Agent 또는 사용자에게 맡긴다.
- **구현의 자유, 구조는 선언적으로**: Node.js, Python, CLI 등 다양한 방식으로 실행 가능하지만, config는 JSON 기반으로 통일
- **언어 독립성**: Node.js, Python, Java, Rust 등 어떤 언어에서도 구현 가능
- **일관된 에러 처리**: 모든 브릿지에서 동일한 에러 클래스를 사용하여 예측 가능한 에러 처리
- **작고 명확한 시작**: 큰 스펙보다 작지만 분명한 구조로 시작하여 선택받도록 한다

### 핵심 메시지

> **LLM Bridge는 프롬프트를 최적화하지 않습니다.**
> 단지 다양한 모델을 구조적으로 선언하고, 교체 가능한 구조를 제공할 뿐입니다.

모델 연결은 Bridge에 맡기고, 사용자 경험은 각 Agent에 맡기세요.

## 📦 설치

```bash
# pnpm (권장)
pnpm add llm-bridge-spec

# npm
npm install llm-bridge-spec

# yarn
yarn add llm-bridge-spec
```

## 🧩 인터페이스 명세

### `LlmBridge`

모든 LLM 브릿지가 구현해야 하는 기본 인터페이스입니다.

```typescript
export interface LlmBridge {
  invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse>;
  invokeStream?(prompt: LlmBridgePrompt, option?: InvokeOption): AsyncIterable<LlmBridgeResponse>;
  getMetadata(): Promise<LlmMetadata>;
}
```

### `LlmBridgePrompt`

LLM에 전달할 프롬프트를 정의합니다.

```typescript
export interface LlmBridgePrompt {
  messages: LlmBridgeMessage[];
}

export interface LlmBridgeMessage {
  role: 'user' | 'assistant' | 'system';
  content: LlmBridgeContent;
}
```

### `InvokeOption`

LLM 호출 시 추가 옵션을 정의합니다.

```typescript
export interface InvokeOption {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequence?: string[];
  tools?: LlmBridgeTool[];
}
```

### `LlmBridgeResponse`

LLM의 응답을 정의합니다.

```typescript
export interface LlmBridgeResponse {
  content: LlmBridgeContent;
  usage?: LlmUsage;
  toolCalls?: LlmBridgeToolCall[];
}
```

## ⚠️ 에러 클래스

`llm-bridge-spec`은 일관된 에러 처리를 위한 계층적 에러 클래스 체계를 제공합니다.

### 기본 에러 클래스

#### `LlmBridgeError`

모든 브릿지 에러의 기본 클래스입니다.

```typescript
import { LlmBridgeError } from 'llm-bridge-spec';

throw new LlmBridgeError('Something went wrong', originalError);
```

#### `ConfigurationError`

설정 검증 실패 시 사용합니다.

```typescript
import { ConfigurationError } from 'llm-bridge-spec';

try {
  const config = ConfigSchema.parse(userConfig);
} catch (error) {
  throw new ConfigurationError('Invalid configuration provided', error);
}
```

### API 에러 클래스

#### `APIError`

기본 API 에러 클래스입니다.

```typescript
import { APIError } from 'llm-bridge-spec';

throw new APIError('API call failed', 500, 'internal_server_error');
```

#### `RateLimitError`

Rate limit 초과 시 사용합니다.

```typescript
import { RateLimitError } from 'llm-bridge-spec';

// OpenAI API 응답에서
if (response.status === 429) {
  const retryAfter = parseInt(response.headers['retry-after'] || '60');
  const resetTime = new Date(response.headers['x-ratelimit-reset-requests'] * 1000);

  throw new RateLimitError(
    'Rate limit exceeded',
    retryAfter, // 재시도까지 대기 시간 (초)
    100, // 시간당 허용 요청 수
    0, // 남은 요청 수
    resetTime // 리셋 시간
  );
}
```

#### `QuotaExceededError`

월간/일간 quota 초과 시 사용합니다.

```typescript
import { QuotaExceededError } from 'llm-bridge-spec';

throw new QuotaExceededError(
  'Monthly token quota exceeded',
  'monthly', // quota 타입
  1000000, // 사용된 토큰 수
  1000000, // 총 토큰 수
  new Date('2024-02-01') // 리셋 날짜
);
```

#### `InvalidRequestError`

잘못된 요청 시 사용합니다.

```typescript
import { InvalidRequestError } from 'llm-bridge-spec';

throw new InvalidRequestError(
  'Missing required parameters',
  ['model', 'messages'] // 누락된 필드들
);
```

#### `InsufficientCreditsError`

크레딧 부족 시 사용합니다.

```typescript
import { InsufficientCreditsError } from 'llm-bridge-spec';

throw new InsufficientCreditsError(
  'Not enough credits for this request',
  10, // 현재 크레딧
  50 // 필요한 크레딧
);
```

#### `ServiceUnavailableError`

서비스 일시 중단 시 사용합니다.

```typescript
import { ServiceUnavailableError } from 'llm-bridge-spec';

throw new ServiceUnavailableError(
  'Service is under maintenance',
  3600 // 재시도까지 대기 시간 (초)
);
```

### 기타 에러 클래스

- **`NetworkError`** - 네트워크 연결 문제
- **`AuthenticationError`** - 인증 실패
- **`ModelNotSupportedError`** - 지원하지 않는 모델
- **`ResponseParsingError`** - 응답 파싱 실패
- **`TimeoutError`** - 요청 타임아웃

## 🚀 사용 예시

### 브릿지 구현체에서의 에러 처리

#### OpenAI Bridge 예시

```typescript
import {
  RateLimitError,
  InvalidRequestError,
  AuthenticationError,
  ServiceUnavailableError,
  QuotaExceededError,
  LlmBridgeError,
} from 'llm-bridge-spec';

export class OpenAIBridge implements LlmBridge {
  async invoke(prompt: LlmBridgePrompt): Promise<LlmBridgeResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: this.toMessages(prompt),
      });

      return this.toLlmBridgeResponse(response);
    } catch (error: any) {
      // OpenAI API 에러를 브릿지 에러로 변환
      if (error.status === 401) {
        throw new AuthenticationError('Invalid API key', error);
      }

      if (error.status === 429) {
        if (error.type === 'insufficient_quota') {
          throw new QuotaExceededError(
            'OpenAI quota exceeded',
            'monthly',
            undefined,
            undefined,
            undefined,
            error
          );
        }
        throw new RateLimitError('Rate limit exceeded', 60, undefined, undefined, undefined, error);
      }

      if (error.status === 400) {
        throw new InvalidRequestError(error.message, undefined, error);
      }

      if (error.status >= 500) {
        throw new ServiceUnavailableError(
          'OpenAI service temporarily unavailable',
          undefined,
          error
        );
      }

      // 기타 에러
      throw new LlmBridgeError(`OpenAI API error: ${error.message}`, error);
    }
  }
}
```

### 클라이언트에서의 에러 처리

```typescript
import {
  RateLimitError,
  QuotaExceededError,
  AuthenticationError,
  NetworkError,
} from 'llm-bridge-spec';

async function handleLLMRequest(bridge: LlmBridge, prompt: LlmBridgePrompt) {
  try {
    return await bridge.invoke(prompt);
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
      // 재시도 로직
      await new Promise(resolve => setTimeout(resolve, error.retryAfter! * 1000));
      return handleLLMRequest(bridge, prompt);
    }

    if (error instanceof QuotaExceededError) {
      console.log(`Quota exceeded (${error.quotaType}). Reset at: ${error.resetTime}`);
      // 사용자에게 quota 초과 알림
      throw error;
    }

    if (error instanceof AuthenticationError) {
      console.log('Authentication failed. Please check your API key');
      // 인증 정보 재설정 유도
      throw error;
    }

    if (error instanceof NetworkError) {
      console.log('Network error occurred. Retrying...');
      // 네트워크 재시도 로직
      return handleLLMRequest(bridge, prompt);
    }

    // 기타 에러
    console.error('Unexpected error:', error.message);
    throw error;
  }
}
```

### 로깅 및 모니터링

```typescript
import { LlmBridgeError, RateLimitError, QuotaExceededError } from 'llm-bridge-spec';

function logError(error: Error, context: any) {
  if (error instanceof LlmBridgeError) {
    // 구조화된 로깅
    logger.error({
      errorType: error.name,
      message: error.message,
      statusCode: 'statusCode' in error ? error.statusCode : undefined,
      apiErrorCode: 'apiErrorCode' in error ? error.apiErrorCode : undefined,
      context,
      cause: error.cause?.message,
    });

    // 특정 에러에 대한 메트릭 수집
    if (error instanceof RateLimitError) {
      metrics.increment('llm_bridge.rate_limit_errors');
    } else if (error instanceof QuotaExceededError) {
      metrics.increment('llm_bridge.quota_exceeded_errors');
    }
  } else {
    logger.error({ message: error.message, context });
  }
}
```

## 🤝 기여하기

이 프로젝트는 [Git Workflow Guide](../../docs/GIT_WORKFLOW_GUIDE.md)를 따릅니다.

1. **Issues**: 새로운 기능이나 버그 리포트를 GitHub Issues에 등록
2. **브랜치 생성**: `git checkout -b feature/core-new-feature`
3. **TODO 기반 개발**: 각 작업을 TODO 단위로 커밋
   ```bash
   git commit -m "✅ [TODO 1/3] Add new interface definition"
   ```
4. **품질 체크**: 커밋 전 반드시 확인
   ```bash
   pnpm lint && pnpm test:ci && pnpm build
   ```
5. **PR 생성**: GitHub에서 Pull Request 생성
6. **코드 리뷰**: 승인 후 Squash Merge

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.
