# 듀얼 ESM/CJS 지원 고도화 계획

## 1. Context
- `ollama-llm-bridge`를 포함한 여러 브리지 패키지가 ESM 전용 환경에서만 동작하여 CJS 기반 소비자와의 호환성 문제가 반복 발생.
- `llm-bridge-spec`의 CJS 출력물이 `type: "module"` 선언과 불일치하여 로더(`DependencyBridgeLoader`) 사용 시 require 단계에서 예외가 보고됨.
- 프로젝트 전반에서 듀얼 패키징 패턴이 일관되지 않아 패키지별 설정/산출물 차이로 유지보수 비용이 증가.

## 2. Success Criteria
- `llm-bridge-spec`, `llm-bridge-loader`, 모든 브리지 패키지가 `require`/`import` 양쪽에서 문제없이 로드됨을 테스트로 검증.
- 모든 관련 `package.json`에 표준화된 `main/module/exports/types/sideEffects` 구성이 적용되고 문서화됨.
- 듀얼 패키징 정책과 검증 절차가 `docs/`에 반영되어 향후 신규 브리지 추가 시 참고 가능.
- 롤백 및 비상 대응 전략이 마련되어 PR/릴리스 시 참조 가능.

## 3. Scope
- **In Scope**: `llm-bridge-spec`, `llm-bridge-loader`, `packages/*-llm-bridge`, 관련 빌드 스크립트·테스트·문서.
- **Out of Scope**: 배포 자동화 스크립트 개선, 외부 소비자 프로젝트 수정, 신규 기능 개발.

## 4. Deliverables
- 듀얼 패키징 표준 가이드 (`docs/DUAL-PACKAGING.md` 신규 또는 기존 문서 업데이트).
- 각 패키지의 `package.json`/`tsconfig`/빌드 스크립트 수정 및 호환성 테스트 코드.
- 호환성 매트릭스 결과 및 회귀 테스트 체크리스트.
- 롤백 매뉴얼 및 릴리스 노트 초안.

## 5. Milestones & Timeline (예상)
| Milestone | 목표 기간 | 설명 |
| --- | --- | --- |
| M1 | 주 1 | 현황 분석 완료 및 결과 공유 |
| M2 | 주 2 | 표준 정책 수립 및 `llm-bridge-spec` 적용 |
| M3 | 주 3 | `llm-bridge-loader` 및 파일럿 브리지(`ollama-llm-bridge`) 적용 |
| M4 | 주 4 | 나머지 브리지 확산 및 통합 검증 |
| M5 | 주 5 | 문서/가이드 확정, 롤백 계획 검토, 배포 준비 |

## 6. TODO Checklist
- [ ] TODO 1: **현황 분석 정리**
  - 각 패키지의 `package.json`(`main`, `module`, `exports`, `types`, `sideEffects`)과 산출물 확장자(`.js`, `.cjs`, `.mjs`) 조사.
  - 빌드 스크립트(`pnpm build`, `tsconfig.*.json`) 차이점 표로 정리.
  - 듀얼 지원이 이미 적용된 사례/미흡한 사례 목록 작성.
- [ ] TODO 2: **공통 듀얼 패키징 정책 수립**
  - 표준 `exports` 맵, 산출물 구조, 타입 정의 위치, `sideEffects` 기본값 명시.
  - 개발자용 가이드 초안(`docs/DUAL-PACKAGING.md` 또는 기존 문서) 작성.
  - 로컬 검증 스크립트/명령어 템플릿 설계.
- [ ] TODO 3: **`llm-bridge-spec` 개편**
  - CJS 산출물(`dist/index.cjs`) 생성 및 `exports.require` 경로와 연동.
  - 타입 출력(`.d.ts`) 경로 통합 및 `exports.types` 업데이트.
  - `require`/`import` Smoke 테스트 추가, Breaking change 영향 평가.
- [ ] TODO 4: **`llm-bridge-loader` 호환성 강화**
  - 동적 로딩 경로를 `await import()` 기반으로 통일하고, CJS 번들에서 동일하게 동작하도록 컴파일 결과 확인.
  - `exports` 조건부 진입점 재구성 및 `.d.ts`/`sideEffects` 검토.
  - CJS/ESM 각각에서 브리지 로딩을 검증하는 테스트 케이스 추가.
- [ ] TODO 5: **파일럿 브리지 적용 (`ollama-llm-bridge`)**
  - 표준 정책을 반영한 `package.json`/빌드 스크립트 수정.
  - `DependencyBridgeLoader`를 통한 Smoke 테스트(`invoke`, `getMetadata`) 작성.
  - 릴리스 노트 템플릿에 ESM/CJS 예제 추가.
- [ ] TODO 6: **전체 브리지 확산**
  - 우선순위(사용 빈도, 의존성)를 기준으로 나머지 브리지에 순차 적용.
  - 공통 패턴/스크립트 활용 및 TODO 완료 여부 문서화.
  - CI 파이프라인에 변경된 빌드/테스트 명령 반영 여부 확인.
- [ ] TODO 7: **통합 검증 & 호환성 매트릭스 실행**
  - Node 16/18/20, 번들러(Webpack/Vite/esbuild), 런타임(Node CJS/ESM, 브라우저) 조합으로 매트릭스 테스트 수행.
  - `pnpm build`, `pnpm test`, `pnpm test:ci`, `apps/gui` E2E(`E2E_OLLAMA=true ...`) 결과 기록.
  - `pnpm test:dual` 등 로컬 검증 스크립트 동작 확인.
- [ ] TODO 8: **문서화 & 롤백 전략 정리**
  - CHANGELOG/README/Docs 업데이트 및 듀얼 패키징 사용 예시 추가.
  - 롤백 절차 (dist-tag, Git 태그, 비상 패치) 문서화.
  - 주요 소비자 알림 계획 및 후속 모니터링 항목 정리.

## 7. Risks & Mitigations
- **Breaking change 노출**: 기존 소비자가 특정 경로를 직접 import 하고 있을 가능성 → `exports` 재구성 시 마지막 단계에서 호환성 확인 및 명확한 마이그레이션 가이드 제공.
- **런타임별 테스트 비용 증가**: 매트릭스 테스트 자동화가 미흡할 수 있음 → 우선 수동/스크립트 기반으로 검증 후 CI 자동화 범위 점진 확대.
- **릴리스 동기화 실패**: 패키지별 릴리스 순서 어긋날 위험 → `llm-bridge-spec` → `llm-bridge-loader` → 브리지 순서의 버전 전략 문서화 및 체크리스트 운영.

## 8. Dependencies & Open Questions
- Node 16 지원을 계속 유지할지 여부(듀얼 패키징 적용 시 지원 범위 재검토 필요).
- 번들러별 테스트 환경을 어떤 수준까지 자동화할지 결정 필요.
- 향후 신규 브리지 추가 시 템플릿/스캐폴드 자동화 여부.

## 9. References
- Issue & 피드백: ESM/CJS 호환성 문제 보고 스레드, Ollama 브리지 로딩 실패 로그.
- 기존 문서: `docs/GIT_WORKFLOW_GUIDE.md`, `docs/DEPLOYMENT_GUIDE.md`.
- 관련 패키지: `packages/llm-bridge-spec`, `packages/llm-bridge-loader`, `packages/ollama-llm-bridge` 등.

