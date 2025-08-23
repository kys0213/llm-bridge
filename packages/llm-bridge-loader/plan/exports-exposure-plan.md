# llm-bridge-loader 배포 노출 이슈 분석 및 개선 계획

## 요약

- 증상: 배포된 `llm-bridge-loader`를 사용하는 소비자 코드에서 `packages/llm-bridge-loader/src/dependency/dependency-bridge.loader.ts`와 같은 내부 경로(딥 임포트)로 접근 시 모듈 해석 오류 발생.
- 핵심 원인:
  - `package.json`의 `exports` 필드가 루트(`.`)만 허용하여 내부 경로 접근이 차단됨.
  - 공개 엔트리(`src/index.ts`)가 비어 있어 공식 퍼블릭 API로 필요한 심볼을 재노출하지 않음.
  - 타입 경로(`types`, `exports.types`)가 `./dist/index.d.ts`를 가리키지만, 빌드 산출물은 `dist/esm`, `dist/cjs` 하위에만 생성되어 타입 경로 불일치.
- 방향: 퍼블릭 API 표면을 명확히 하고(`src/index.ts` 재수출), `exports`/`types`/빌드 산출물 정합성을 맞춘 뒤, 딥 임포트를 금지하는 가이드를 제공하고 회귀 방지 테스트 추가.

---

## 현상 상세

- 소비자 코드에서 다음과 같은 임포트를 사용할 때 런타임/번들 단계에서 오류 발생:
  - `import { DependencyBridgeLoader } from 'llm-bridge-loader/src/dependency/dependency-bridge.loader'`
- Node의 패키지 `exports` 동작상, `exports`가 정의된 패키지는 선언된 서브패스 외 접근이 차단됨. 현재 `package.json.exports`는 루트(`.`)만 제공.

## 원인 분석

1. 퍼블릭 API 미정의(빈 엔트리)

- `src/index.ts`가 비어 있어 루트 임포트(`import {...} from 'llm-bridge-loader'`)로 필요한 클래스/타입을 사용할 수 없음 → 소비자들이 내부 경로로 우회.

2. `exports` 서브패스 미정의

- `package.json.exports`가 루트만 노출 → 내부 경로 접근 시 즉시 차단(Node ESM 규칙) → 위 1)과 결합해 오류 유발.

3. 타입 경로 불일치

- `package.json.types` 및 `exports['.'].types`가 `./dist/index.d.ts`로 설정되어 있으나, 빌드는 `dist/esm/index.d.ts`, `dist/cjs/index.d.ts`만 생성.
- 결과적으로 타입 해석 시 경로 미일치 가능성/경고 발생.

4. 배포 파일 범위

- 현재 `files` 필드가 없어 소스(`src/`)가 패키지에 포함될 수 있으나, `exports`가 막고 있어 접근 불가. 혼란 유발.

## 개선 방안

### A. 퍼블릭 API 확립(최우선)

- `src/index.ts`에서 공식 퍼블릭 API로 필요한 심볼을 재노출.
  - 예: `export { DependencyBridgeLoader } from './dependency/dependency-bridge.loader';`
  - 예: `export type { BridgeLoader, BridgeLoadResult, ScanOptions } from './types';`
- README의 예제와 일치하게 루트 임포트만으로 사용 가능하도록 보장.

### B. package.json 정합성 수정

- `types`: `"./dist/esm/index.d.ts"`로 갱신(ESM 기본 노출에 맞춤) 또는 `dist` 루트 타입 산출 전략 중 하나로 일원화.
- `exports['.']`에 `types`도 일치하도록 갱신.
- 선택: 서브패스 공식 지원이 필요하면 명시적으로 정의(예: `"./dependency"` → ESM/CJS/types 매핑). 단, 내부 구조 고정 리스크가 커서 현 단계에서는 권장하지 않음.

### C. 빌드 산출물 정책 정리

- 현재 듀얼 빌드(ESM: `dist/esm`, CJS: `dist/cjs`)는 적절. 타입 참조만 일관화 필요.
- 옵션 1(권장): `types`를 `dist/esm/index.d.ts`로 지정하여 ESM 타입을 기준으로 노출.
- 옵션 2: 별도 타입 전용 빌드(`tsconfig.types.json`)로 `dist/index.d.ts` 생성 후 `types`를 그 경로로 통일.

### D. 배포 포함 파일 명시

- `package.json.files`에 배포 대상만 포함: `dist/**`, `README.md`, `LICENSE`, 필수 메타 파일 등.
- 소스는 배포에서 제외하여 혼란 방지.

### E. 딥 임포트 방지 가이드

- README와 CHANGELOG에 “내부 경로 임포트 금지, 루트 임포트 사용”을 명확히 표기.
- 소비자 코드 변경 가이드 제공(마이그레이션 섹션 참조).

### F. 회귀 방지 테스트/검증

- 유닛: 루트 임포트로 `DependencyBridgeLoader`가 정상 임포트되는지 테스트.
- 패키징 검증: `npm pack` 후 tarball 검사 → `exports`/`types`/파일 포함 범위 확인.
- 런타임 스모크: Node ESM/CJS 환경 각각에서 로더 임포트/간단 호출 스모크 테스트.

---

## 구체적 작업 항목(체크리스트)

- [ ] `src/index.ts`에 퍼블릭 API 재수출 추가
  - `export { DependencyBridgeLoader } from './dependency/dependency-bridge.loader';`
  - `export type { BridgeLoader, BridgeLoadResult, ScanOptions } from './types';`
- [ ] `package.json` 수정
  - [ ] `types` → `"./dist/esm/index.d.ts"`로 변경(옵션 1 기준)
  - [ ] `exports['.'].types`도 동일 경로로 변경
  - [ ] `files` 필드 추가: `["dist/**", "README.md", "LICENSE"]`
  - [ ] 필요 시 `sideEffects` 검토(없으면 `false`)
- [ ] README 업데이트(루트 임포트만 안내, 딥 임포트 금지 문구 추가)
- [ ] 스모크/유닛 테스트 추가(루트 임포트 검증)
- [ ] `pnpm build` → `npm pack`으로 산출물 확인 및 경로 검증
- [ ] 버전 패치(`npm version patch`) 및 배포 준비

---

## 마이그레이션 가이드(소비자 코드)

- 변경 전(문제 패턴):
  - `import { DependencyBridgeLoader } from 'llm-bridge-loader/src/dependency/dependency-bridge.loader'`
- 변경 후(권장 패턴):
  - `import { DependencyBridgeLoader } from 'llm-bridge-loader'`

추가로 타입만 필요한 경우:

- `import type { BridgeLoader, BridgeLoadResult, ScanOptions } from 'llm-bridge-loader'`

---

## 검증 시나리오

1. 로컬 빌드/패키징
   - `pnpm --filter llm-bridge-loader build`
   - `cd packages/llm-bridge-loader && npm pack && tar -tf llm-bridge-loader-*.tgz`
   - 포함 파일과 `package.json`의 `exports`/`types` 경로 확인
2. ESM 소비자 스모크
   - Node 22 환경에서 `import { DependencyBridgeLoader } from 'llm-bridge-loader'` 실행 확인
3. CJS 소비자 스모크
   - `const { DependencyBridgeLoader } = require('llm-bridge-loader')` 실행 확인
4. 타입 확인
   - TS 프로젝트에서 `import type {...} from 'llm-bridge-loader'` 시 정상 타입 해석

---

## 리스크 및 대응

- 딥 임포트를 이미 사용 중인 소비자들의 브레이킹 변경 가능성
  - 대응: 마이그레이션 가이드 제공, 마이너/패치 버전에도 릴리즈 노트로 안내
- 타입 경로 변경으로 IDE 캐시 혼선
  - 대응: 릴리즈 노트에 `node_modules` 재설치/TS 서버 재시작 안내

---

## 일정 제안

- Day 0: 코드/설정 수정(A~D), 유닛/스모크 추가(F), 문서화(E)
- Day 1: 검증 시나리오 실행, `npm pack`/소비자 샘플 프로젝트 테스트
- Day 1: 패치 배포(0.0.x → +1), 후속 모니터링

---

## 부록: 현재 설정에서 확인된 문제점 요약

- `src/index.ts`가 비어 있어 공식 API가 실질적으로 없음 → 소비자 딥 임포트 유발
- `package.json.types`가 실제 산출물(`dist/esm|cjs/index.d.ts`)과 불일치 → 타입 해석 이슈 가능
- `exports`가 루트만 노출 → 내부 경로 임포트는 구조적으로 차단됨
- `files` 미정의 → 소스 포함 가능하지만 접근은 차단되는 반(혼란 초래)
