# Ollama LLM Bridge E2E 테스트 계획서

## 개요

이 문서는 `ollama-llm-bridge` 패키지의 E2E 테스트 계획을 다룹니다. `llm-bridge-spec/src/error/`에 정의된 에러 케이스들을 실제 Ollama 서비스 환경에서 검증하여, 에러 처리 로직이 올바르게 동작하는지 확인합니다.

## 📋 TODO 체크리스트

### Phase 1: 기본 기능 테스트 구현 ✅

- [x] `bridge-functionality.e2e.test.ts` 파일 생성
  - [x] `invoke()` 메서드 기본 테스트
  - [x] `getMetadata()` 메서드 테스트
  - [x] `getSupportedModels()` 메서드 테스트
- [x] 테스트 환경 설정 유틸리티 구현
  - [x] Ollama 서버 연결 확인 헬퍼
  - [x] 테스트용 모델 검증 로직
  - [x] 환경 변수 설정 검증

### Phase 2: 고급 기능 테스트 구현 ✅

- [x] `streaming.e2e.test.ts` 파일 생성
  - [x] `invokeStream()` 기본 스트리밍 테스트
  - [x] 스트리밍 중단 처리 테스트
  - [x] 빈 응답 스트리밍 테스트
- [x] `model-switching.e2e.test.ts` 파일 생성
  - [x] `setModel()` 런타임 모델 변경 테스트
  - [x] `getCurrentModel()` 현재 모델 조회 테스트
  - [x] `getDefaultConfig()` 기본 설정 테스트

### Phase 3: 에러 처리 테스트 구현 ✅

- [x] `configuration.e2e.test.ts` 파일 생성
  - [x] ConfigurationError 테스트 케이스
  - [x] 잘못된 설정값 처리 테스트
- [x] `network.e2e.test.ts` 파일 생성
  - [x] NetworkError 테스트 케이스
  - [x] 연결 실패 시나리오 테스트
- [x] `model-validation.e2e.test.ts` 파일 생성
  - [x] ModelNotSupportedError 테스트 케이스
  - [x] 지원하지 않는 모델 처리 테스트
- [x] `response-handling.e2e.test.ts` 파일 생성
  - [x] InvalidRequestError 테스트 케이스
  - [x] ResponseParsingError 테스트 케이스
  - [x] TimeoutError 테스트 케이스
  - [x] ServiceUnavailableError 테스트 케이스
  - [x] APIError 테스트 케이스

### Phase 4: 통합 및 성능 테스트 구현

- [ ] `performance.e2e.test.ts` 파일 생성
  - [ ] 응답 시간 측정 테스트
  - [ ] 스트리밍 효율성 테스트
  - [ ] 메모리 사용량 모니터링 테스트
- [ ] 통합 시나리오 테스트 구현
  - [ ] 모델 전환 시나리오 테스트
  - [ ] 장시간 대화 시나리오 테스트
  - [ ] 동시 요청 처리 시나리오 테스트

### 테스트 인프라 및 설정 ✅

- [x] `vitest.config.ts` E2E 테스트 설정 업데이트
- [x] `package.json`에 E2E 테스트 스크립트 추가
- [x] 테스트 환경 변수 문서화
- [x] CI/CD 파이프라인에서 E2E 테스트 스킵 설정
- [ ] 로컬 개발환경 테스트 실행 가이드 작성
- [ ] Mock 서버 구현 (네트워크 에러 시뮬레이션용)

### 문서화 및 가이드

- [ ] README.md에 E2E 테스트 실행 방법 추가
- [x] 각 테스트 파일에 상세한 주석 추가
- [ ] 테스트 실패 시 디버깅 가이드 작성
- [ ] 성능 벤치마크 결과 문서화

### 완료된 작업 ✅

- [x] E2E 테스트 계획서 작성
- [x] 에러 클래스 분석 완료
- [x] OllamaBridge 기능 분석 완료
- [x] 테스트 구조 설계 완료
- [x] docs 디렉토리 생성
- [x] test-utils.ts 환경 설정 유틸리티 구현
- [x] bridge-functionality.e2e.test.ts 기본 기능 테스트
- [x] streaming.e2e.test.ts 스트리밍 기능 테스트
- [x] model-switching.e2e.test.ts 모델 전환 테스트
- [x] configuration.e2e.test.ts 설정 에러 테스트
- [x] network.e2e.test.ts 네트워크 에러 테스트
- [x] model-validation.e2e.test.ts 모델 검증 테스트
- [x] response-handling.e2e.test.ts 응답 처리 테스트
- [x] Vitest 설정 업데이트

## 테스트 대상 에러 클래스

### 1. ConfigurationError

- **설명**: 설정 검증 실패 시 발생하는 에러
- **발생 조건**: Zod 스키마 검증 실패, 필수 설정 누락 등

#### 테스트 케이스

1. **잘못된 호스트 URL 형식**

   - 조건: `host: "invalid-url"` 설정
   - 예상 결과: `ConfigurationError` 발생

2. **지원하지 않는 모델 설정**

   - 조건: `model: "unsupported-model"` 설정
   - 예상 결과: `ConfigurationError` 발생

3. **필수 설정 필드 누락**

   - 조건: `host` 또는 `model` 누락
   - 예상 결과: `ConfigurationError` 발생

4. **잘못된 타입의 설정값**
   - 조건: `temperature: "invalid"` (숫자가 아닌 값)
   - 예상 결과: `ConfigurationError` 발생

### 2. NetworkError

- **설명**: 네트워크 연결 문제로 발생하는 에러
- **발생 조건**: 연결 타임아웃, DNS 실패, 네트워크 불가 등

#### 테스트 케이스

1. **Ollama 서버 연결 실패**

   - 조건: Ollama 서버가 실행되지 않은 상태에서 API 호출
   - 예상 결과: `NetworkError` 발생 (ECONNREFUSED)

2. **잘못된 호스트 주소**

   - 조건: `host: "http://non-existent-host:11434"`
   - 예상 결과: `NetworkError` 발생 (DNS 실패)

3. **네트워크 타임아웃**
   - 조건: 매우 느린 네트워크 환경 시뮬레이션
   - 예상 결과: `NetworkError` 발생 (ETIMEDOUT)

### 3. ServiceUnavailableError

- **설명**: 서비스 이용 불가 시 발생하는 에러
- **발생 조건**: 서버 점검, 일시적 장애 등

#### 테스트 케이스

1. **Ollama 서버 다운**

   - 조건: Ollama 서버가 중단된 상태
   - 예상 결과: `ServiceUnavailableError` 발생 (연결 거부)

2. **Ollama 서버 503 응답**
   - 조건: 서버가 503 상태 코드 반환
   - 예상 결과: `ServiceUnavailableError` 발생

### 4. ModelNotSupportedError

- **설명**: 지원하지 않는 모델 요청 시 발생하는 에러

#### 테스트 케이스

1. **존재하지 않는 모델 요청**

   - 조건: `model: "non-existent-model"`
   - 예상 결과: `ModelNotSupportedError` 발생

2. **Ollama에 설치되지 않은 모델**
   - 조건: 지원 목록에는 있지만 Ollama에 설치되지 않은 모델
   - 예상 결과: `ModelNotSupportedError` 발생

### 5. InvalidRequestError

- **설명**: 잘못된 요청으로 인한 에러
- **발생 조건**: 필수 파라미터 누락, 잘못된 형식 등

#### 테스트 케이스

1. **빈 메시지 배열**

   - 조건: `messages: []`
   - 예상 결과: `InvalidRequestError` 발생

2. **잘못된 메시지 형식**

   - 조건: 메시지에 `role` 또는 `content` 누락
   - 예상 결과: `InvalidRequestError` 발생

3. **잘못된 파라미터 값**
   - 조건: `temperature: -1` (범위 외 값)
   - 예상 결과: `InvalidRequestError` 발생

### 6. ResponseParsingError

- **설명**: 응답 파싱 실패 시 발생하는 에러
- **발생 조건**: JSON 파싱 실패, 예상과 다른 응답 형식 등

#### 테스트 케이스

1. **잘못된 JSON 응답**

   - 조건: Ollama가 유효하지 않은 JSON 반환
   - 예상 결과: `ResponseParsingError` 발생

2. **예상과 다른 응답 구조**
   - 조건: 필수 필드가 누락된 응답
   - 예상 결과: `ResponseParsingError` 발생

### 7. TimeoutError

- **설명**: 요청 타임아웃 시 발생하는 에러

#### 테스트 케이스

1. **긴 응답 시간**

   - 조건: 매우 긴 텍스트 생성 요청으로 타임아웃 유발
   - 예상 결과: `TimeoutError` 발생

2. **AbortController를 통한 타임아웃**
   - 조건: 의도적으로 요청 중단
   - 예상 결과: `TimeoutError` 발생

### 8. APIError (일반)

- **설명**: 기타 API 호출 실패
- **발생 조건**: Rate limit, invalid request, API 서버 에러 등

#### 테스트 케이스

1. **Ollama 서버 500 에러**

   - 조건: 서버 내부 오류 발생
   - 예상 결과: `APIError` 발생

2. **알 수 없는 API 에러**
   - 조건: 예상하지 못한 API 응답
   - 예상 결과: `APIError` 발생

## 테스트 구조

### 파일 구조

```
packages/ollama-llm-bridge/src/__tests__/
├── e2e/
│   ├── error-handling.e2e.test.ts        # 메인 에러 처리 테스트
│   ├── configuration.e2e.test.ts         # 설정 관련 에러 테스트
│   ├── network.e2e.test.ts              # 네트워크 관련 에러 테스트
│   ├── model-validation.e2e.test.ts     # 모델 검증 에러 테스트
│   └── response-handling.e2e.test.ts    # 응답 처리 에러 테스트
```

### 테스트 환경 설정

#### 필요한 환경

1. **Ollama 서버**: localhost:11434에 실행
2. **설치된 모델**:
   - gemma3n:latest (7.5 GB, 12 days ago)
   - llama3.2:latest (2.0 GB, 3 months ago)
3. **네트워크 시뮬레이션**: 타임아웃, 연결 실패 등을 위한 목서버

#### 환경 변수

```bash
OLLAMA_HOST=http://localhost:11434
OLLAMA_TEST_MODEL=llama3.2        # Bridge에서 사용하는 모델명 (태그 제외)
TEST_TIMEOUT=30000
SKIP_E2E_TESTS=false  # CI에서 E2E 테스트 스킵
```

#### 모델명 매핑

- **Ollama 저장 형식**: `llama3.2:latest`, `gemma3n:latest`
- **Bridge 사용 형식**: `llama3.2`, `gemma3n` (태그 제외)

### 테스트 패턴

#### 기본 테스트 구조

```typescript
describe('Error Handling E2E Tests', () => {
  let bridge: OllamaBridge;

  beforeAll(async () => {
    // 테스트 환경 확인
    if (process.env.SKIP_E2E_TESTS === 'true') {
      console.warn('Skipping E2E tests');
      return;
    }
    // Ollama 서버 연결 확인
  });

  describe('ConfigurationError', () => {
    it('should throw ConfigurationError for invalid host URL', async () => {
      expect(() => {
        new OllamaBridge({ host: 'invalid-url', model: 'llama3.2' });
      }).toThrow(ConfigurationError);
    });
  });
});
```

#### 에러 검증 패턴

```typescript
it('should throw NetworkError when Ollama server is down', async () => {
  const bridge = new OllamaBridge({
    host: 'http://localhost:99999', // 사용하지 않는 포트
    model: 'llama3.2',
  });

  await expect(
    bridge.invoke({
      messages: [{ role: 'user', content: { contentType: 'text', value: 'Hello' } }],
    })
  ).rejects.toThrow(NetworkError);
});
```

## 구현 우선순위

### Phase 1: 기본 에러 테스트

1. `ConfigurationError` - 설정 검증 테스트
2. `NetworkError` - 연결 실패 테스트
3. `ModelNotSupportedError` - 모델 검증 테스트

### Phase 2: API 관련 에러 테스트

1. `InvalidRequestError` - 잘못된 요청 테스트
2. `ResponseParsingError` - 응답 파싱 테스트
3. `ServiceUnavailableError` - 서비스 이용 불가 테스트

### Phase 3: 고급 에러 테스트

1. `TimeoutError` - 타임아웃 테스트
2. `APIError` - 일반 API 에러 테스트

## 실행 방법

### 로컬 개발 환경

```bash
# Ollama 서버 시작
ollama serve

# 테스트 모델 다운로드
ollama pull llama3.2
ollama pull gemma3n:latest

# E2E 테스트 실행
cd packages/ollama-llm-bridge
pnpm test:e2e
```

### CI 환경

```bash
# E2E 테스트 스킵 (외부 의존성 때문에)
SKIP_E2E_TESTS=true pnpm test
```

## 주의사항

1. **외부 의존성**: Ollama 서버가 실행되어야 하므로 CI에서는 스킵
2. **테스트 격리**: 각 테스트는 독립적으로 실행되어야 함
3. **타임아웃 설정**: 네트워크 테스트는 충분한 타임아웃 설정 필요
4. **리소스 정리**: 테스트 후 생성된 리소스 정리 필요

## OllamaBridge 기능 테스트

### 핵심 메서드 테스트

#### 1. invoke() - 일반 LLM 호출

**테스트 케이스:**

1. **정상 텍스트 생성**

   - 조건: 유효한 프롬프트와 옵션으로 호출
   - 예상 결과: `LlmBridgeResponse` 형식의 응답 반환

2. **다양한 InvokeOption 테스트**

   - 조건: temperature, maxTokens, topP 등 옵션 설정
   - 예상 결과: 설정된 옵션이 Ollama API에 올바르게 전달

3. **멀티턴 대화 테스트**
   - 조건: 여러 메시지가 포함된 대화 세션
   - 예상 결과: 대화 맥락을 유지한 응답 생성

#### 2. invokeStream() - 스트리밍 호출

**테스트 케이스:**

1. **스트리밍 응답 생성**

   - 조건: 긴 텍스트 생성 요청으로 스트리밍 호출
   - 예상 결과: AsyncGenerator로 청크별 응답 수신

2. **스트리밍 중단 테스트**

   - 조건: 스트리밍 중 연결 중단 또는 취소
   - 예상 결과: 적절한 에러 처리 및 리소스 정리

3. **빈 스트리밍 응답**
   - 조건: 매우 짧은 응답을 스트리밍으로 요청
   - 예상 결과: 최소 하나의 청크라도 올바르게 수신

#### 3. getMetadata() - 메타데이터 조회

**테스트 케이스:**

1. **모델 메타데이터 반환**

   - 조건: 초기화된 모델의 메타데이터 요청
   - 예상 결과: `LlmMetadata` 형식의 정보 반환

2. **모델별 메타데이터 차이**
   - 조건: Llama, Gemma 등 다른 모델로 초기화
   - 예상 결과: 각 모델의 고유한 메타데이터 반환

#### 4. resolveModel() - 모델 해석 (private)

**테스트 케이스:**

1. **지원 모델 자동 감지**

   - 조건: 'llama3.2', 'gemma3n:latest' 등 지원 모델 ID
   - 예상 결과: 해당 모델 구현체 반환

2. **지원하지 않는 모델**
   - 조건: 'gpt-4', 'claude-3' 등 지원하지 않는 모델
   - 예상 결과: `ModelNotSupportedError` 발생

#### 5. getSupportedModels() - 지원 모델 목록

**테스트 케이스:**

1. **전체 지원 모델 목록 반환**
   - 조건: 메서드 호출
   - 예상 결과: `ALL_SUPPORTED_MODELS` 배열 반환

#### 6. setModel() - 모델 변경

**테스트 케이스:**

1. **런타임 모델 변경**

   - 조건: 'llama3.2'에서 'gemma3n:latest'로 변경
   - 예상 결과: 내부 모델 인스턴스와 설정 업데이트

2. **잘못된 모델로 변경 시도**
   - 조건: 지원하지 않는 모델로 변경
   - 예상 결과: `ModelNotSupportedError` 발생

#### 7. getCurrentModel() - 현재 모델 조회

**테스트 케이스:**

1. **현재 활성 모델 ID 반환**
   - 조건: 초기화 후 또는 모델 변경 후 호출
   - 예상 결과: 현재 설정된 모델 ID 문자열 반환

#### 8. getDefaultConfig() - 기본 설정 조회

**테스트 케이스:**

1. **모델별 기본 설정 반환**
   - 조건: 각 모델의 기본 설정 요청
   - 예상 결과: 모델별 최적화된 기본 설정 반환

### 통합 시나리오 테스트

#### 1. 모델 전환 시나리오

**테스트 시퀀스:**

1. Llama 모델로 초기화
2. 텍스트 생성 요청
3. Gemma 모델로 변경
4. 동일한 프롬프트로 텍스트 생성
5. 결과 비교 및 모델별 특성 확인

#### 2. 장시간 대화 시나리오

**테스트 시퀀스:**

1. 초기 대화 시작
2. 10회 이상의 연속 대화 진행
3. 컨텍스트 유지 확인
4. 메모리 사용량 모니터링

#### 3. 동시 요청 처리 시나리오

**테스트 시퀀스:**

1. 동일한 브릿지 인스턴스로 여러 invoke() 동시 호출
2. 스트리밍과 일반 호출 혼재
3. 요청 간 간섭 없음 확인

### 성능 테스트

#### 1. 응답 시간 측정

- **지표**: 첫 토큰까지의 시간, 전체 완료 시간
- **조건**: 다양한 길이의 프롬프트와 생성 길이

#### 2. 스트리밍 효율성

- **지표**: 청크 간 지연 시간, 총 처리량
- **조건**: 긴 텍스트 생성 시 스트리밍 vs 일반 호출 비교

#### 3. 메모리 사용량

- **지표**: 메모리 사용량, 가비지 컬렉션 빈도
- **조건**: 장시간 실행 및 대량 요청 처리

## 업데이트된 테스트 구조

### 파일 구조

```
packages/ollama-llm-bridge/src/__tests__/
├── e2e/
│   ├── error-handling.e2e.test.ts        # 에러 처리 테스트
│   ├── configuration.e2e.test.ts         # 설정 관련 테스트
│   ├── network.e2e.test.ts              # 네트워크 관련 테스트
│   ├── model-validation.e2e.test.ts     # 모델 검증 테스트
│   ├── response-handling.e2e.test.ts    # 응답 처리 테스트
│   ├── bridge-functionality.e2e.test.ts # OllamaBridge 핵심 기능 테스트
│   ├── streaming.e2e.test.ts            # 스트리밍 기능 테스트
│   ├── model-switching.e2e.test.ts      # 모델 전환 기능 테스트
│   └── performance.e2e.test.ts          # 성능 테스트
```

### 업데이트된 구현 우선순위

#### Phase 1: 기본 기능 테스트

1. `invoke()` - 기본 텍스트 생성
2. `getMetadata()` - 메타데이터 조회
3. `getSupportedModels()` - 지원 모델 목록

#### Phase 2: 고급 기능 테스트

1. `invokeStream()` - 스트리밍 기능
2. `setModel()` / `getCurrentModel()` - 모델 전환
3. `getDefaultConfig()` - 설정 관리

#### Phase 3: 에러 처리 테스트

1. 기존 에러 케이스들 (ConfigurationError, NetworkError 등)
2. 기능별 에러 시나리오

#### Phase 4: 통합 및 성능 테스트

1. 모델 전환 시나리오
2. 장시간 대화 테스트
3. 동시 요청 처리
4. 성능 벤치마크

## 기대 효과

1. **안정성 향상**: 다양한 에러 시나리오에 대한 견고한 처리
2. **사용자 경험**: 명확하고 유용한 에러 메시지 제공
3. **디버깅 효율성**: 에러 발생 시 빠른 원인 파악 가능
4. **코드 품질**: 에러 처리 로직의 정확성 검증
5. **기능 신뢰성**: 모든 핵심 기능의 정상 동작 보장
6. **성능 최적화**: 성능 병목 지점 식별 및 개선
