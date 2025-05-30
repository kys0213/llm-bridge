# AGENTS Guide

이 문서는 레포지토리 구조와 각종 개발 가이드를 찾을 수 있는 위치를 간단히 안내합니다.

## 목차

- [코드 작성 가이드](CODE_GUIDE.md)
- [인터페이스 스펙](INTERFACE_SPEC.md)
- [테스트 가이드](TEST_GUIDE.md)
- [문제 해결 전략](PROBLEM_SOLVING.md)

## 1. 레포 개요

- **프로젝트 명**: LLM Bridge
- **목적**: 다양한 LLM(Large Language Model) 서비스를 통합하고 관리하는 모노레포
- **패키지 관리**: pnpm
- **Node/Pnpm 버전**: Node.js >=22, pnpm >=8

## 2. 주요 디렉터리

- `packages/llm-bridge-loader` – LLM 서비스 로더 (README 포함)
- `packages/llm-bridge-spec` – LLM 서비스 스펙 및 타입 정의 (README 포함)
- `packages/llama3-llm-bridge` – Llama3 모델 브릿지
- `packages/openai-gpt4-llm-bridge` – OpenAI GPT-4 브릿지
- `packages/bedrock-anthropic-llm-bridge` – Amazon Bedrock Anthropic 브릿지

패키지별 사용법과 스크립트는 각 `package.json`과 README를 확인하세요.

## 3. 공통 작업 명령어 (루트 기준)

```bash
# 전체 패키지 빌드
pnpm build
# 테스트 실행
pnpm test
# 린트 검사
pnpm lint
# 린트 자동 수정
pnpm lint:fix
# 코드 포맷팅
pnpm format
```

## 4. 커밋 및 PR

- 일반적인 GitHub 플로우를 사용합니다. (포크 → 브랜치 생성 → 커밋 → PR)
- 자세한 절차는 README의 "기여하기" 섹션을 참고하세요.

---
세부 내용은 위 목차에 있는 개별 문서를 확인해 주세요.

