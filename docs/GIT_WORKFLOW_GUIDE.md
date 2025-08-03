# Git Workflow Guide

## 🎯 **브랜치 전략**

### **브랜치 명명 규칙**

```bash
# UX 기능 개발
feature/ux-command-palette
feature/ux-session-management
feature/ux-message-search

# 컴포넌트 개발
feature/component-fab-system
feature/component-settings-panel

# core 로직 개발
feature/redis-chat-session-storage
feature/new-

# 버그 수정
fix/chatapp-state-sync
fix/css-grid-layout

# 성능 최적화
perf/virtual-scrolling
perf/bundle-splitting

# 리팩터링
refactor/component-separation
refactor/state-management
```

### **브랜치 생성 및 전환**

```bash
# 1. 최신 main 브랜치로 전환
git checkout main
git pull origin main

# 2. 새 기능 브랜치 생성
git checkout -b feature/ux-command-palette

# 3. 작업 완료 후 PR을 통한 병합
git push origin feature/ux-command-palette
# GitHub에서 Pull Request 생성
# Code Review 및 승인 후 Squash Merge

# 4. PR 병합 후 로컬 브랜치 정리
git checkout main
git pull origin main
git branch -d feature/ux-command-palette
```

## 📝 **TODO별 커밋 전략**

### **커밋 메시지 규칙**

```bash
# TODO 완료 시
✅ [TODO 1/5] Add Command Palette basic structure

# 중간 진행 시
🚧 [TODO 2/5] WIP: Implement keyboard shortcuts for Command Palette

# TODO 완료 시
✅ [TODO 2/5] Complete keyboard shortcut implementation

# 전체 기능 완료 시
🎉 [FEATURE] Complete Command Palette system implementation
```

### **실제 작업 예시**

```bash
# Command Palette 기능 개발 예시

# 1. 브랜치 생성
git checkout -b feature/ux-command-palette

# 2. TODO 1 완료 후 커밋
git add .
git commit -m "✅ [TODO 1/4] Add kbar library integration and basic setup"

# 3. TODO 2 완료 후 커밋
git add .
git commit -m "✅ [TODO 2/4] Implement command actions and keyboard shortcuts"

# 4. TODO 3 완료 후 커밋
git add .
git commit -m "✅ [TODO 3/4] Add command categories and search functionality"

# 5. TODO 4 완료 후 커밋
git add .
git commit -m "✅ [TODO 4/4] Complete Command Palette integration with app state"

# 6. 기능 완료 커밋
git add .
git commit -m "🎉 [FEATURE] Complete Command Palette system implementation

- Cmd+K keyboard shortcut for instant access
- Categories: chat, settings, navigation, mcp
- Real-time search with fuzzy matching
- Context-aware command suggestions
- Integration with app state and navigation

Resolves: GUI_CYCLIC_UX_REDESIGN_PLAN.md Phase 1 Task 1"
```

## 🔄 **작업 흐름**

### **새 기능 시작 시**

1. **계획서 확인**: 해당 `*_PLAN.md` 문서의 TODO 리스트 검토
2. **브랜치 생성**: 기능명에 맞는 브랜치 생성
3. **TODO 단위 작업**: 각 TODO 완료 시마다 커밋
4. **테스트 실행**: `pnpm lint` && `pnpm test:ci` 통과 확인
5. **문서 업데이트**: 완료된 TODO 체크 후 커밋
6. **기능 완료**: 전체 기능 완료 커밋 후 **PR 생성**

### **⚠️ 중요: PR 기반 워크플로우**

**절대 로컬에서 main 브랜치로 직접 머지하지 마세요!**

```bash
# ❌ 잘못된 방법 - 직접 머지 금지
git checkout main
git merge feature/my-branch  # 절대 금지!

# ✅ 올바른 방법 - PR을 통한 머지
git push origin feature/my-branch
# GitHub에서 Pull Request 생성
# Code Review → 승인 → Squash Merge
```

### **PR (Pull Request) 프로세스**

#### **1. PR 생성 단계**

```bash
# 작업 완료 후 브랜치 푸시
git push origin feature/your-branch

# GitHub에서 PR 생성:
# 1. "Compare & pull request" 클릭
# 2. 제목: 🎉 [FEATURE] 기능 설명
# 3. 설명: TODO 체크리스트 및 변경사항 요약
# 4. Assignees: 본인 지정
# 5. Labels: feature/bugfix/docs 등 적절한 라벨
```

#### **2. PR 템플릿**

```markdown
## 🎯 작업 내용

- [ ] TODO 1: 설명
- [ ] TODO 2: 설명
- [ ] TODO 3: 설명

## 📝 주요 변경사항

- 새로운 기능/수정 내용 설명
- 영향받는 파일들
- 테스트 결과

## ✅ 체크리스트

- [ ] `pnpm lint` 통과
- [ ] `pnpm test:ci` 통과
- [ ] `pnpm build` 통과
- [ ] 문서 업데이트 완료

## 📋 관련 문서

- 관련 PLAN.md 파일
- 기타 참고 문서
```

### **코드 리뷰 기준**

- **전체 기능 검토**: PR 단위로 종합적인 기능 완성도 평가
- **커밋별 리뷰**: TODO 단위의 세부 변경사항 검토
- **문서 동기화**: 계획서의 TODO 체크와 실제 구현 일치 확인
- **테스트 커버리지**: 새로운 기능에 대한 적절한 테스트 코드 작성
- **Breaking Changes**: 기존 API에 영향을 주는 변경사항 확인

## 📊 **품질 관리**

### **커밋 전 체크리스트**

```bash
# 자동화된 체크
pnpm lint      # 코드 스타일 검증
pnpm typecheck # 타입 오류 검증
pnpm test      # 단위 테스트 실행
pnpm build     # 빌드 오류 확인
```

# 수동 체크

- [ ] TODO 항목이 완전히 완료되었는가?
- [ ] 관련 문서가 업데이트되었는가?
- [ ] 다른 기능에 영향을 주지 않는가?

### **PR 머지 전 체크리스트**

**🔒 PR 머지 조건 (모두 충족 필요):**

- [ ] 모든 TODO가 완료되었는가?
- [ ] 계획서의 성공 조건을 만족하는가?
- [ ] **최소 1명 이상의 Code Review 승인**
- [ ] **GitHub Actions CI 모든 체크 통과**
- [ ] 통합 테스트가 통과하는가?
- [ ] 문서가 최신 상태로 업데이트되었는가?
- [ ] **Conflicts 해결 완료**

**🚀 머지 방식:**

- **Squash Merge 사용** (기본값)
- 커밋 히스토리 정리 및 main 브랜치 클린 유지
- 머지 후 자동으로 기능 브랜치 삭제

## 🚀 **자동화 가능한 개선사항**

### **Git Hooks 활용**

```bash
# pre-commit hook
#!/bin/sh
# .git/hooks/pre-commit
pnpm lint
pnpm test
```

### **커밋 템플릿**

```bash
# .gitmessage
# 📋 [TODO x/y] 간단한 설명
#
# 상세 설명:
# - 구현된 기능
# - 변경된 파일들
# - 테스트 결과
#
# 관련 문서: GUI_*_PLAN.md
```

---

## 🚨 **중요한 규칙들**

### **절대 금지 사항**

```bash
# ❌ main 브랜치에서 직접 개발 금지
git checkout main
# main에서 파일 수정 후 커밋 → 금지!

# ❌ 로컬에서 main으로 직접 머지 금지
git checkout main
git merge feature/branch → 금지!

# ❌ main 브랜치로 직접 push 금지
git push origin main → 금지!
```

### **권장 사항**

```bash
# ✅ 항상 기능 브랜치에서 작업
git checkout -b feature/new-function

# ✅ PR을 통한 머지만 허용
git push origin feature/new-function
# GitHub PR 생성 → Review → Merge

# ✅ 머지 후 로컬 브랜치 정리
git checkout main
git pull origin main
git branch -d feature/new-function
```

## 💡 **핵심 원칙**

1. **작은 단위, 자주 커밋**: TODO별로 명확한 진행상황 추적
2. **의미있는 커밋 메시지**: 나중에 히스토리를 추적하기 쉽게
3. **문서와 코드 동기화**: 계획서의 TODO와 실제 구현 일치
4. **품질 우선**: 각 단계에서 테스트와 린트 통과 필수
5. **🔥 PR 필수**: 모든 main 브랜치 변경은 반드시 PR을 통해서만!

**이 워크플로우를 통해 안전하고 체계적인 협업 개발 프로세스를 구축할 수 있습니다.**
