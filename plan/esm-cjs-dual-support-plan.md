# 듀얼 ESM/CJS 지원 고도화 계획

## 0. 현황 분석

- 각 패키지(`llm-bridge-spec`, `llm-bridge-loader`, 개별 브리지)의 `package.json` 내 `exports`, `main`, `module`, `types`, `sideEffects` 필드 구조와 현재 산출물 확장자(`.js`, `.cjs`, `.mjs`)를 조사해 표로 정리.
- 빌드 스크립트와 TypeScript 설정(`tsconfig.*.json`)을 확인해 공통 옵션과 패키지별 차이를 파악, 중복/불일치 지점을 기록.
- 이미 듀얼 지원이 부분적으로 구현된 패키지를 식별하고, 재사용 가능한 패턴과 개선이 필요한 사례를 문서화.
- 조사 결과를 Confluence/문서(또는 `docs/` 내)로 정리하여 이후 단계의 기준 자료로 활용.

## 1. 공통 정책 수립

- 모든 패키지에 적용할 듀얼 패키징 규칙 정의: 출력 디렉터리(`dist/`=CJS, `esm/`=ESM), 파일 확장자(`index.cjs`, `index.js`), 타입 정의 위치(`dist/index.d.ts`), `sideEffects` 플래그 등.
- `package.json` 표준 예시:
  ```json
  {
    "main": "./dist/index.cjs",
    "module": "./esm/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./esm/index.js",
        "require": "./dist/index.cjs"
      }
    },
    "sideEffects": false
  }
  ```
- 빌드 스크립트와 `tsconfig` 템플릿을 표준화하여 패키지별로 동일한 명령으로 듀얼 산출물이 생성되도록 조정.
- 루트 공통 스크립트(`scripts/postbuild-esm.cjs`)로 `esm/package.json`(`"type": "module"`)을 생성해 모든 패키지에서 재사용.
- 개발자가 참고할 공통 가이드(예: `docs/DUAL-PACKAGING.md`) 초안을 작성해 향후 패키지 추가 시 활용 가능하도록 준비.

## 2. `llm-bridge-spec` 정비

- CJS 산출물을 `dist/index.cjs`로 출력하도록 빌드 파이프라인 수정 (`tsconfig.cjs.json`의 `outFile`/`outDir` 점검 및 확장자 변환 스텝 추가).
- `package.json` `exports`를 위 표준 규칙에 맞춰 정리하고, 타입 정의(`dist/types/index.d.ts` → `dist/index.d.ts` 여부) 재배치 검토.
- `.d.ts` 파일 경로와 실제 산출물이 일치하는지 확인하고, 필요 시 `tsconfig.types.json` 수정.
- Smoke 테스트 추가:
  - Node CJS: `node -e "const spec = require('llm-bridge-spec');"`
  - Node ESM: `node -e "import('llm-bridge-spec').then(m => console.log(typeof m));" --input-type=module`
- Breaking change 여부를 판단해 메이저/마이너 버전 전략 수립.

## 3. `llm-bridge-loader` 호환성 강화

- CJS 번들(`dist/`)에서 동적 로드 시에도 ESM 브리지를 다룰 수 있도록 코드 수정:
  ```ts
  export async function loadModule(pkg: string) {
    if (typeof require !== 'undefined') {
      return import(pkg); // Node 20+ CJS에서도 동작
    }
    return import(pkg);
  }
  ```
  또는 TypeScript 단계에서 `await import(pkg)`를 사용하도록 정의하고, TS 컴파일이 `.cjs` 출력에서도 동일 패턴을 생성하도록 확인.
- `exports` 조건부 진입점에 `./dist/index.cjs`, `./esm/index.js` 명시.
- 테스트 확장:
  - CJS 환경에서 `require('llm-bridge-loader')` 후 `load('ollama-llm-bridge')` 실행.
  - ESM 환경에서 `import { DependencyBridgeLoader }` 후 동일 시나리오 검증.
- `.d.ts` 매핑과 `sideEffects` 설정을 재확인하고, 번들 크기/트리쉐이킹 영향 검토.

## 4. 개별 브리지 패키지 적용 (파일럿 → 전체 전개)

- 파일럿 대상으로 `ollama-llm-bridge` 선정: 현 구조 분석 → 표준 정책 적용 → 빌드/테스트 → 사용 예제 업데이트.
- 파일럿 결과를 템플릿으로 정리한 뒤, 우선순위(사용량, 의존도)를 기준으로 나머지 브리지(`openai`, `anthropic`, `bedrock`, `xai-grok`, …)에 순차 적용.
- 각 브리지의 `package.json`, 빌드 스크립트, TS 설정을 표준에 맞게 정리하고, `default` export 및 manifest/factory 노출 패턴을 확인.
- 로더를 통한 Smoke 테스트(동적 로드 후 `invoke`, `getMetadata`, `getCapabilities`)를 작성해 공통 활용.

## 5. 통합 검증 및 품질 보증

- 루트에서 `pnpm build`, `pnpm test`, `pnpm test:ci` 실행 후 로그를 공유하고, 실패 시 원인 분석 절차 문서화.
- 호환성 매트릭스 정의 및 검증:
  - Node 버전: 16.x, 18.x, 20.x 이상 (각각 CJS/ESM 모드)
  - 번들러: Webpack, Vite, esbuild (샘플 프로젝트 또는 스크립트로 테스트)
  - 런타임: Node CLI, 브라우저 번들 (가능 시)
- 로컬 검증 스크립트 마련: `pnpm test:dual` (CJS/ESM 로딩 체커), `pnpm sandbox:esm-loader` 등.
- 실 사용 시나리오 확인: `apps/gui`에서 ESM/CJS 환경별 실행, `E2E_OLLAMA=true pnpm --dir apps/gui test:e2e -- --grep "Ollama 브리지가"` 수행.

## 6. 롤백 및 리스크 대응

- 듀얼 패키징 전환이 미칠 잠재적 Breaking change를 사전 검토하고, 필요한 경우 메이저 버전 업 또는 프리릴리스 태그(beta) 운영.
- 문제 발생 시 롤백 절차:
  1. npm에 이전 버전 `dist-tag` 유지
  2. Git 태그 및 브랜치 복구 전략 문서화
  3. 긴급 패치 릴리스 프로세스 정의
- 영향 범위를 줄이기 위해 주요 소비자(내부 앱, 파트너 프로젝트)와 사전 커뮤니케이션 채널 확보.

## 7. 문서화 및 배포 전략

- CHANGELOG, README, `docs/` 문서에 듀얼 지원 변경 사항과 import/require 예제를 추가.
- 타입 정의 위치(`dist/index.d.ts`)와 `exports.types` 매핑을 명시하여 소비자가 바로 활용 가능하도록 안내.
- CI/CD(GitHub Actions 등)에 듀얼 빌드/테스트 명령 추가 및 캐싱 전략 업데이트.
- 릴리스 순서: `llm-bridge-spec` → `llm-bridge-loader` → 개별 브리지. 각 단계별 품질 체크 후 다음 단계 진행.
- 배포 완료 후 회귀 테스트 계획 수립, 주요 지표(다운스트림 호환성 보고) 모니터링.
