# Code Style Guide

This project uses **TypeScript** with ESLint and Prettier to keep the codebase consistent.

- Run `pnpm lint` to check lint errors.
- Run `pnpm format` to automatically format files.
- Follow the rules defined in `.eslintrc.json` and `.prettierrc`.
- Use arrow function parentheses and avoid unused variables unless prefixed with `_`.

## LLM Bridge Project Structure

### 1. Package Directory Structure

All LLM Bridge packages should follow this standard structure:

```
packages/{provider}-{model}-llm-bridge/
├── src/
│   ├── bridge/
│   │   ├── {provider}-{model}-bridge.ts     # Main bridge implementation
│   │   └── {provider}-{model}-manifest.ts   # Manifest definition
│   ├── __tests__/
│   │   └── {provider}-{model}-bridge.e2e.test.ts
│   └── index.ts                             # Entry point
├── package.json
├── tsconfig.json                            # CommonJS build
├── tsconfig.esm.json                        # ESM build
└── vitest.config.ts
```

### 2. Naming Conventions

#### Package Names

- Pattern: `{provider}-{model}-llm-bridge`
- Examples: `llama3-llm-bridge`, `openai-gpt4-llm-bridge`

#### Class Names

- Bridge Class: `{Provider}{Model}Bridge`
- Options Interface: `{Provider}{Model}BridgeOptions`
- Examples: `OllamaLlama3Bridge`, `OllamaLlama3BridgeOptions`

#### File Names

- Bridge Implementation: `{provider}-{model}-bridge.ts`
- Manifest: `{provider}-{model}-manifest.ts`
- Test: `{provider}-{model}-bridge.e2e.test.ts`

#### Constant Names

- Manifest: `{PROVIDER}_{MODEL}_MANIFEST`
- Examples: `OLLAMA_LLAMA3_MANIFEST`

### 3. Required Implementation Elements

#### Bridge Class (`*-bridge.ts`)

```typescript
import { LlmBridge, LlmBridgePrompt, InvokeOption, LlmBridgeResponse } from 'llm-bridge-spec';

export interface {Provider}{Model}BridgeOptions {
  // Provider-specific configuration options
}

export class {Provider}{Model}Bridge implements LlmBridge {
  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    // Implementation required
  }

  async *invokeStream(prompt: LlmBridgePrompt, option?: InvokeOption): AsyncIterable<LlmBridgeResponse> {
    // Implementation required
  }
}
```

#### Manifest (`*-manifest.ts`)

```typescript
import { LlmManifest } from 'llm-bridge-spec';

export const {PROVIDER}_{MODEL}_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: '{provider}-{model}-bridge',
  language: 'typescript',
  entry: 'src/bridge/{provider}-{model}-bridge.ts',
  configSchema: {
    // Configuration schema in JSON Schema format
  },
  capabilities: {
    // Specify supported capabilities
  },
  description: 'The bridge for the {model} model',
};
```

#### Entry Point (`index.ts`)

```typescript
import { LlmManifest } from 'llm-bridge-spec';
import { {Provider}{Model}Bridge } from './bridge/{provider}-{model}-bridge';
import { {PROVIDER}_{MODEL}_MANIFEST } from './bridge/{provider}-{model}-manifest';

export default {Provider}{Model}Bridge;

export function manifest(): LlmManifest {
  return {PROVIDER}_{MODEL}_MANIFEST;
}
```

### 4. Package Configuration

#### Required package.json Fields

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
  },
  "dependencies": {
    "llm-bridge-spec": "workspace:*"
  }
}
```

#### Build Scripts

```json
{
  "scripts": {
    "build": "rimraf dist esm && tsc -p tsconfig.json && tsc -p tsconfig.esm.json",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 5. TypeScript Configuration

#### tsconfig.json (CommonJS)

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "module": "CommonJS",
    "target": "ES2020"
  }
}
```

#### tsconfig.esm.json (ESM)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "outDir": "./esm"
  }
}
```

## Additional Guidelines

1. **SOLID Principles** — design modules and classes to obey SOLID principles for maintainability.
2. **Clean Architecture** — aim for a clear dependency flow and avoid circular references.
3. **Test-Driven Development** — write tests first when adding new behavior.
4. **Type Safety** — favor generics and avoid `any`. If you must accept unknown input, use `unknown` and guard types before use.

### Type Guards

Use type guards instead of `as any` assertions to ensure type safety. Create specific type guard functions for runtime type checking.

#### ✅ Good: Using Type Guards

```typescript
// Define type guard functions
function hasErrorCode(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function hasCause(error: unknown): error is { cause: unknown } {
  return typeof error === 'object' && error !== null && 'cause' in error;
}

// Use type guards in error handling
if (error.name === 'TypeError' && errorMessage.includes('fetch failed')) {
  if (hasCause(error) && hasErrorCode(error.cause)) {
    if (error.cause.code === 'ECONNREFUSED') {
      // Safe to access error.cause.code
    }
  }
}
```

#### ❌ Bad: Using Type Assertions

```typescript
// Avoid this - no runtime safety
const cause = (error as any).cause;
if (cause && cause.code === 'ECONNREFUSED') {
  // This might fail at runtime
}
```

#### Type Guard Naming Convention

- Use `is{Type}` for type predicate functions
- Use `has{Property}` for property existence checks
- Example: `isNetworkError`, `hasStatusCode`, `isFetchError`
