# EmbeddingGemma Embedding Bridge

Google의 온디바이스 임베딩 모델인 **EmbeddingGemma**를 `@xenova/transformers` 런타임 위에서 사용할 수 있도록 감싼 브릿지 패키지입니다.

## 설치

```bash
pnpm add embeddinggemma-embedding-bridge @xenova/transformers
```

## 빠른 시작

```ts
import { createEmbeddingGemmaBridge } from 'embeddinggemma-embedding-bridge';

const bridge = createEmbeddingGemmaBridge();
const { embeddings } = await bridge.embed({ input: '안녕하세요' });

console.log('embedding length:', embeddings.length);
```

## 구성 옵션

`createEmbeddingGemmaBridge` 혹은 생성자에 전달되는 설정은 모두 선택 사항이며, 필요한 부분만 오버라이드할 수 있습니다.

```ts
const bridge = createEmbeddingGemmaBridge({
  model: 'google/embedding-gemma-002',
  pipeline: {
    revision: 'main',
    quantized: true,
    cacheDir: '/models/gemma',
    localFilesOnly: true,
    device: 'gpu',
  },
  embedding: {
    pooling: 'cls',
    normalize: false,
    batchSize: 4,
  },
});
```

### 일반 옵션

- `model` – 로드할 Hugging Face 모델 ID. 기본값은 `google/embedding-gemma-002` 입니다.

### `pipeline`

`@xenova/transformers`의 `pipeline` 생성 시 전달되는 옵션입니다.

- `revision` – 모델 리비전 지정
- `quantized` – 양자화된 체크포인트 사용 여부
- `cacheDir` – 모델 다운로드/캐시 경로 (`cache_dir`)
- `localFilesOnly` – 오프라인 캐시만 사용할지 여부 (`local_files_only`)
- `progressCallback` – 모델 로딩 진행률 콜백
- `device` – 실행 디바이스 (`'cpu'`, `'gpu'`, 숫자 인덱스 등 지원)
- `dtype` – 가중치 데이터 타입 (예: `'fp16'`)
- `executionProviders` – ONNX Runtime 실행 프로바이더 목록

### `embedding`

실제 임베딩 계산 시 파이프라인 호출에 전달되는 옵션입니다.

- `pooling` – `'mean' | 'max' | 'cls'` (기본값 `'mean'`)
- `normalize` – L2 정규화 여부 (기본값 `true`)
- `batchSize` – 배치 처리 크기 (`batch_size`)

## 동작 특성

- 입력은 문자열 또는 `contentType: 'text'` 인 멀티모달 콘텐츠만 지원합니다.
- 파이프라인에서 반환된 텐서를 자동으로 평탄화하여 `number[]` 혹은 `number[][]` 형태로 제공합니다.
- `getMetadata()`는 모델 설정의 hidden size를 추정하여 임베딩 차원을 알려줍니다.

## 테스트

```bash
pnpm --filter embeddinggemma-embedding-bridge test:ci
```
