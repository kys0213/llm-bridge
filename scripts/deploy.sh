#!/bin/bash

# LLM Bridge 모노레포 배포 스크립트
# main branch 머지 시 변경된 패키지들을 npm에 배포

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로깅 함수
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 변수 확인
check_environment() {
  log_info "환경 변수 확인 중..."
  
  if [ -z "$NPM_TOKEN" ]; then
    log_error "NPM_TOKEN 환경 변수가 설정되지 않았습니다."
    exit 1
  fi
  
  if [ -z "$GITHUB_TOKEN" ]; then
    log_error "GITHUB_TOKEN 환경 변수가 설정되지 않았습니다."
    exit 1
  fi
  
  log_success "환경 변수 확인 완료"
}

# npm 인증 설정
setup_npm_auth() {
  log_info "npm 인증 설정 중..."
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
  log_success "npm 인증 설정 완료"
}

# Git 설정
setup_git() {
  log_info "Git 설정 중..."
  git config --global user.name "LLM Bridge Bot"
  git config --global user.email "action@github.com"
  log_success "Git 설정 완료"
}

# 변경된 패키지 감지
detect_changed_packages() {
  log_info "변경된 패키지 감지 중..."
  
  # HEAD~1과 HEAD 사이의 변경사항 확인
  CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
  
  # packages 디렉토리 내 변경된 패키지들 감지
  CHANGED_PACKAGES=""
  
  for file in $CHANGED_FILES; do
    if [[ $file == packages/* ]]; then
      PACKAGE_DIR=$(echo $file | cut -d'/' -f1-2)
      if [[ ! $CHANGED_PACKAGES =~ $PACKAGE_DIR ]]; then
        CHANGED_PACKAGES="$CHANGED_PACKAGES $PACKAGE_DIR"
      fi
    fi
  done
  
  echo "$CHANGED_PACKAGES"
}

# 패키지 버전 업데이트
update_package_version() {
  local package_path=$1
  local package_name=$(basename "$package_path")
  
  log_info "$package_name 버전 업데이트 중..."
  
  cd "$package_path"
  
  # 현재 버전 가져오기
  CURRENT_VERSION=$(node -p "require('./package.json').version")
  log_info "현재 버전: $CURRENT_VERSION"
  
  # 패치 버전 자동 증가
  NEW_VERSION=$(npm version patch --no-git-tag-version)
  log_success "$package_name 버전 업데이트: $CURRENT_VERSION -> $NEW_VERSION"
  
  cd - > /dev/null
  echo "$NEW_VERSION"
}

# 패키지 빌드
build_package() {
  local package_path=$1
  local package_name=$(basename "$package_path")
  
  log_info "$package_name 빌드 중..."
  
  cd "$package_path"
  
  # 빌드 실행
  if pnpm build; then
    log_success "$package_name 빌드 완료"
  else
    log_error "$package_name 빌드 실패"
    cd - > /dev/null
    return 1
  fi
  
  cd - > /dev/null
  return 0
}

# 패키지 배포
publish_package() {
  local package_path=$1
  local package_name=$(basename "$package_path")
  
  log_info "$package_name npm 배포 중..."
  
  cd "$package_path"
  
  # 패키지 정보 확인
  local PACKAGE_VERSION=$(node -p "require('./package.json').version")
  local IS_PRIVATE=$(node -p "require('./package.json').private || false")
  
  if [ "$IS_PRIVATE" = "true" ]; then
    log_warning "$package_name은 private 패키지이므로 배포를 건너뜁니다."
    cd - > /dev/null
    return 0
  fi
  
  # npm에 해당 버전이 이미 존재하는지 확인
  if npm view "${package_name}@${PACKAGE_VERSION}" version > /dev/null 2>&1; then
    log_warning "$package_name@$PACKAGE_VERSION은 이미 npm에 존재합니다. 배포를 건너뜁니다."
    cd - > /dev/null
    return 0
  fi
  
  # 배포 실행
  if pnpm publish --access public --no-git-checks; then
    log_success "$package_name@$PACKAGE_VERSION npm 배포 완료"
  else
    log_error "$package_name npm 배포 실패"
    cd - > /dev/null
    return 1
  fi
  
  cd - > /dev/null
  return 0
}

# Git 변경사항 커밋 및 푸시
commit_version_changes() {
  log_info "버전 변경사항 커밋 중..."
  
  # 변경된 package.json 파일들 스테이징
  git add packages/*/package.json
  
  if git diff --staged --quiet; then
    log_info "커밋할 변경사항이 없습니다."
    return 0
  fi
  
  # 커밋 메시지 생성
  COMMIT_MSG="chore: bump package versions [skip ci]"
  
  git commit -m "$COMMIT_MSG"
  git push origin main
  
  log_success "버전 변경사항 커밋 및 푸시 완료"
}

# 메인 배포 로직
main() {
  log_info "=== LLM Bridge 배포 시작 ==="
  
  # 환경 확인
  check_environment
  setup_npm_auth
  setup_git
  
  # 변경된 패키지 감지
  CHANGED_PACKAGES=$(detect_changed_packages)
  
  if [ -z "$CHANGED_PACKAGES" ]; then
    log_info "변경된 패키지가 없습니다. 배포를 종료합니다."
    exit 0
  fi
  
  log_info "변경된 패키지: $CHANGED_PACKAGES"
  
  # 의존성 순서 정의 (llm-bridge-spec이 먼저 배포되어야 함)
  DEPENDENCY_ORDER=(
    "packages/llm-bridge-spec"
    "packages/llm-bridge-loader"
    "packages/ollama-llm-bridge"
    "packages/openai-llm-bridge"
    "packages/bedrock-llm-bridge"
  )
  
  # 배포할 패키지 목록 정렬
  PACKAGES_TO_DEPLOY=""
  for package in "${DEPENDENCY_ORDER[@]}"; do
    if [[ $CHANGED_PACKAGES =~ $package ]]; then
      PACKAGES_TO_DEPLOY="$PACKAGES_TO_DEPLOY $package"
    fi
  done
  
  # 나머지 변경된 패키지들 추가 (정렬되지 않은 패키지들)
  for package in $CHANGED_PACKAGES; do
    if [[ ! $PACKAGES_TO_DEPLOY =~ $package ]]; then
      PACKAGES_TO_DEPLOY="$PACKAGES_TO_DEPLOY $package"
    fi
  done
  
  log_info "배포 순서: $PACKAGES_TO_DEPLOY"
  
  # 각 패키지 처리
  DEPLOYED_PACKAGES=""
  for package_path in $PACKAGES_TO_DEPLOY; do
    if [ -d "$package_path" ]; then
      log_info "=== $package_path 처리 중 ==="
      
      # 버전 업데이트
      NEW_VERSION=$(update_package_version "$package_path")
      
      # 빌드
      if build_package "$package_path"; then
        # 배포
        if publish_package "$package_path"; then
          DEPLOYED_PACKAGES="$DEPLOYED_PACKAGES $package_path"
        else
          log_error "$package_path 배포 실패"
          exit 1
        fi
      else
        log_error "$package_path 빌드 실패"
        exit 1
      fi
    else
      log_warning "$package_path 디렉토리가 존재하지 않습니다."
    fi
  done
  
  # Git 변경사항 커밋
  if [ -n "$DEPLOYED_PACKAGES" ]; then
    commit_version_changes
    log_success "=== 배포 완료 ==="
    log_success "배포된 패키지: $DEPLOYED_PACKAGES"
  else
    log_info "배포된 패키지가 없습니다."
  fi
}

# 스크립트 실행
main "$@"