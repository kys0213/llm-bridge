# 테스트 가이드

이 프로젝트는 [Vitest](https://vitest.dev/)를 사용하여 테스트를 수행합니다.

## 실행 방법

루트 디렉터리에서 다음 명령어를 실행하면 모든 패키지의 테스트가 수행됩니다.

```bash
pnpm test
```

특정 패키지만 테스트하려면 `--filter` 옵션을 사용할 수 있습니다.

```bash
pnpm --filter <package-name> test
```

테스트 파일은 각 패키지의 `src` 또는 `tests` 폴더에 위치합니다.

