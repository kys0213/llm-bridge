# AGENTS Guide

AI Agent companion document for LLM Bridge development. This guide provides structured information for AI-assisted coding tasks.

## Quick Reference

**Project Type:** pnpm monorepo  
**Tech Stack:** TypeScript 5.x+, Node.js 22+, Vitest  
**Architecture:** Plugin-based LLM bridge system with standardized interfaces  
**Build System:** Dual package (CJS/ESM) with TypeScript-only compilation

### Core Interfaces

```typescript
// Main bridge interface - all LLM providers must implement
interface LlmBridge {
  invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse>;
  invokeStream?(prompt: LlmBridgePrompt, option?: InvokeOption): AsyncIterable<LlmBridgeResponse>;
  getMetadata(): Promise<LlmMetadata>;
}

// Request structure
interface LlmBridgePrompt {
  messages: Message[];
}

// Response structure
interface LlmBridgeResponse {
  content: MultiModalContent;
  usage?: LlmUsage;
  toolCalls?: ToolCall[];
}
```

## Package Map

### Core Infrastructure

- **`llm-bridge-spec`** - Type definitions, interfaces, and specifications

### LLM Bridge Implementations

- **`llama3-llm-bridge`** - Ollama-based Llama3 bridge
- **`openai-gpt4-llm-bridge`** - OpenAI GPT-4 bridge
- **`bedrock-anthropic-llm-bridge`** - Amazon Bedrock Anthropic bridge
- **`bedrock-llama3-llm-bridge`** - Amazon Bedrock Llama3 bridge
- **`gemma3n-llm-bridge`** - Ollama-based Gemma 3n bridge

### Dependencies

```
All bridges → llm-bridge-spec (workspace:*)
Bridges use peer dependencies for their respective SDKs
```

## Development Patterns

### Git Workflow

**IMPORTANT**: Follow [Git Workflow Guide](./docs/GIT_WORKFLOW_GUIDE.md) for all development work.

**Branch Strategy:**

- `feature/ux-*` - UX improvements and user interface features
- `feature/component-*` - Component development
- `feature/core-*` - Core logic and functionality
- `fix/*` - Bug fixes
- `perf/*` - Performance optimizations
- `refactor/*` - Code refactoring

**Commit Guidelines:**

- `✅ [TODO x/y] Description` - TODO completion
- `🚧 [TODO x/y] WIP: Description` - Work in progress
- `🎉 [FEATURE] Description` - Feature completion

**Quality Checks (before each commit):**

```bash
pnpm lint      # Code style verification
pnpm test:ci   # Unit tests (skip E2E)
pnpm build     # Build verification
```

### Code Quality & Formatting

- **Automatic formatting:** Pre-commit hooks ensure consistent code style
- **CI Integration:** Format checks run in CI with detailed error reporting
- **Local tools:** Use `pnpm format:check:detailed` for comprehensive format validation
- **Configuration:** Prettier with project-specific rules in `.prettierrc.json`

### Adding New Bridge Package

**Follow Git Workflow**: Create `feature/core-{provider}-{model}-bridge` branch before starting.

1. **Create package structure:**

```
packages/{provider}-{model}-llm-bridge/
├── src/
│   ├── bridge/
│   │   ├── {provider}-{model}-bridge.ts
│   │   └── {provider}-{model}-manifest.ts
│   ├── __tests__/
│   │   └── {provider}-{model}-bridge.e2e.test.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── tsconfig.esm.json
└── vitest.config.ts
```

2. **Bridge implementation template:**

```typescript
export class {Provider}{Model}Bridge implements LlmBridge {
  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse>
  async *invokeStream(prompt: LlmBridgePrompt, option?: InvokeOption): AsyncIterable<LlmBridgeResponse>
  async getMetadata(): Promise<LlmMetadata>
}
```

3. **Manifest template:**

```typescript
export const {PROVIDER}_{MODEL}_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: '{provider}-{model}-bridge',
  language: 'typescript',
  entry: 'src/bridge/{provider}-{model}-bridge.ts',
  configSchema: { /* JSON Schema */ },
  capabilities: { /* Supported features */ },
  description: 'The bridge for the {model} model'
}
```

4. **Entry point pattern:**

```typescript
export default {Provider}{Model}Bridge;
export function manifest(): LlmManifest {
  return {PROVIDER}_{MODEL}_MANIFEST;
}
```

### Testing Patterns

- **Unit tests:** `*.test.ts` next to source files
- **E2E tests:** `src/__tests__/*.e2e.test.ts` for integration testing
  - These files are skipped in CI via `pnpm test:ci`
- **Test structure:** Use `describe` blocks, meaningful assertions
- **Coverage:** Use `@vitest/coverage-v8`

### Package Configuration Patterns

**Dual package support:**

```json
{
  "main": "./dist/index.js",
  "module": "./esm/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./esm/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

**Build scripts:**

```json
{
  "build": "rimraf dist esm && tsc -p tsconfig.json && tsc -p tsconfig.esm.json",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

## Deployment System

### Automated CD Pipeline

- **Trigger**: main branch merge with changes in `packages/` directory
- **Process**: Changed packages → Version bump → Build → Test → npm publish
- **Dependencies**: Publishes in dependency order (llm-bridge-spec first)
- **Requirements**: NPM_TOKEN secret configured in GitHub

### Manual Deployment

```bash
# Deploy all changed packages
./scripts/deploy.sh

# Deploy specific package manually
cd packages/{package-name}
npm version patch
pnpm build
pnpm publish --access public
```

## Common Development Tasks

### Workspace Commands (from root)

```bash
# Build all packages
pnpm build

# Test all packages
pnpm test
pnpm test:ci  # Skip E2E tests (for CI)

# Code quality (follow before each commit)
pnpm lint
pnpm lint:fix
pnpm format                    # Auto-fix formatting
pnpm format:check             # Check formatting only
pnpm format:check:detailed    # Detailed formatting check with error details

# Work with specific package
pnpm --filter {package-name} build
pnpm --filter {package-name} test

# Git workflow commands
git checkout -b feature/component-new-bridge  # Create feature branch
git commit -m "✅ [TODO 1/3] Add bridge structure"  # TODO-based commits
git checkout main && git merge feature/component-new-bridge  # Merge completed feature

# Deployment (automated)
./scripts/deploy.sh           # Manual deployment script
```

### Debugging Bridge Issues

1. Check manifest configuration schema
2. Verify invoke/invokeStream implementations
3. Test with minimal prompt structure
4. Validate response format compliance

### Fixing Format Issues

1. **Quick fix:** `pnpm format` - automatically formats all files
2. **Check issues:** `pnpm format:check:detailed` - shows specific problem files
3. **Pre-commit:** Husky automatically formats staged files before commit
4. **CI failure:** Check format issues in CI logs, fix locally with `pnpm format`

### Adding New Capabilities

**Git Workflow**: Use `feature/core-*` branch for core functionality changes.

1. Update `llm-bridge-spec` types if needed (`✅ [TODO 1/5]`)
2. Implement in bridge class (`✅ [TODO 2/5]`)
3. Update manifest capabilities (`✅ [TODO 3/5]`)
4. Add corresponding tests (`✅ [TODO 4/5]`)
5. Update documentation (`✅ [TODO 5/5]`)

**Commit each TODO separately** with quality checks:

```bash
# After each TODO completion
pnpm lint && pnpm test:ci && git commit -m "✅ [TODO x/5] Description"
```

## Naming Conventions

- **Packages:** `{provider}-{model}-llm-bridge`
- **Classes:** `{Provider}{Model}Bridge`, `{Provider}{Model}BridgeOptions`
- **Files:** `{provider}-{model}-bridge.ts`, `{provider}-{model}-manifest.ts`
- **Constants:** `{PROVIDER}_{MODEL}_MANIFEST`
- **Tests:** `{provider}-{model}-bridge.e2e.test.ts`

## Reference Documentation

- [Code Style Guide](./docs/CODE_GUIDE.md) - Detailed coding standards and patterns
- [Interface Specification](./docs/INTERFACE_SPEC.md) - Core interface definitions
- [Test Guide](./docs/TEST_GUIDE.md) - Testing frameworks and patterns
- [Problem Solving Strategy](./docs/PROBLEM_SOLVING.md) - Debugging and troubleshooting
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Automated deployment and release process
- [Git Workflow Guide](./docs/GIT_WORKFLOW_GUIDE.md) - Branch strategy and commit guidelines

## Key Files to Check

**When working on bridges:**

- `packages/llm-bridge-spec/src/bridge/types.ts` - Core interfaces
- `packages/llm-bridge-spec/src/manifest/types.ts` - Manifest structure
- `packages/llm-bridge-spec/src/message/types.ts` - Message types

**For package setup:**

- Root `package.json` - Workspace scripts and dependencies
- `pnpm-workspace.yaml` - Workspace configuration
- Individual `package.json` files - Package-specific configuration
