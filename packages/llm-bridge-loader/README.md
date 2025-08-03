# LLM Bridge Loader

A powerful and flexible dependency-based bridge loader for LLM Bridge packages. Automatically discover, validate, and load LLM bridges from your project dependencies.

## 🚀 Features

- **Automatic Discovery**: Automatically detects LLM bridge packages in dependencies
- **Dynamic Loading**: Loads bridges at runtime based on configuration
- **Type Safety**: Full TypeScript support with comprehensive type checking
- **Validation**: Validates bridge manifests and configurations using Zod schemas
- **Error Handling**: Robust error handling with detailed error messages
- **Extensible**: Easy to extend with custom bridge loaders

## 📦 Installation

```bash
# pnpm (권장)
pnpm add llm-bridge-loader llm-bridge-spec zod

# npm
npm install llm-bridge-loader llm-bridge-spec zod

# yarn
yarn add llm-bridge-loader llm-bridge-spec zod
```

## 🎯 Quick Start

### Basic Usage

```typescript
import { DependencyBridgeLoader } from 'llm-bridge-loader';

// Create a loader instance
const loader = new DependencyBridgeLoader();

// Load a bridge by package name
const bridge = await loader.loadBridge('ollama-llm-bridge', {
  host: 'http://localhost:11434',
  model: 'llama3.2',
  temperature: 0.7,
});

// Use the bridge
const response = await bridge.invoke({
  messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello!' }] }],
});

console.log(response.choices[0].message.content[0].text);
```

### Configuration-Based Loading

```typescript
import { DependencyBridgeLoader } from 'llm-bridge-loader';

const loader = new DependencyBridgeLoader();

// Load multiple bridges from configuration
const bridges = await loader.loadBridgesFromConfig([
  {
    name: 'ollama',
    package: 'ollama-llm-bridge',
    config: {
      host: 'http://localhost:11434',
      model: 'llama3.2',
      temperature: 0.7,
    },
  },
  {
    name: 'openai',
    package: 'openai-llm-bridge',
    config: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      temperature: 0.8,
    },
  },
]);

// Use specific bridge
const ollamaBridge = bridges.get('ollama');
const openAIBridge = bridges.get('openai');
```

## 🧩 Core Concepts

### Bridge Discovery

The loader automatically discovers LLM bridge packages by:

1. **Package Name Pattern**: Looking for packages ending with `-llm-bridge`
2. **Manifest Function**: Checking for a `manifest()` export
3. **Bridge Class**: Verifying the default export implements `LlmBridge`

### Bridge Loading Process

```typescript
// 1. Discover available bridges
const availableBridges = await loader.discoverBridges();

// 2. Get bridge information
const bridgeInfo = await loader.getBridgeInfo('ollama-llm-bridge');
console.log(bridgeInfo.manifest.capabilities);

// 3. Load and configure bridge
const bridge = await loader.loadBridge('ollama-llm-bridge', config);
```

## 📋 API Reference

### `DependencyBridgeLoader`

Main class for loading LLM bridges from dependencies.

#### Methods

##### `loadBridge(packageName: string, config: unknown): Promise<LlmBridge>`

Loads a specific bridge with configuration.

```typescript
const bridge = await loader.loadBridge('ollama-llm-bridge', {
  model: 'llama3.2',
  temperature: 0.7,
});
```

##### `discoverBridges(): Promise<string[]>`

Discovers all available LLM bridge packages.

```typescript
const packages = await loader.discoverBridges();
console.log(packages); // ['ollama-llm-bridge', 'openai-llm-bridge', ...]
```

##### `getBridgeInfo(packageName: string): Promise<BridgePackageInfo>`

Gets detailed information about a bridge package.

```typescript
const info = await loader.getBridgeInfo('ollama-llm-bridge');
console.log(info.manifest.name);
console.log(info.manifest.capabilities);
```

##### `loadBridgesFromConfig(configs: BridgeConfig[]): Promise<Map<string, LlmBridge>>`

Loads multiple bridges from configuration array.

```typescript
const bridges = await loader.loadBridgesFromConfig([
  { name: 'ollama', package: 'ollama-llm-bridge', config: { model: 'llama3.2' } },
  { name: 'openai', package: 'openai-llm-bridge', config: { model: 'gpt-4' } },
]);
```

### Types

#### `BridgeConfig`

Configuration for loading a bridge.

```typescript
interface BridgeConfig {
  name: string;         // Unique identifier for the bridge
  package: string;      // Package name (e.g., 'ollama-llm-bridge')
  config: unknown;      // Bridge-specific configuration
}
```

#### `BridgePackageInfo`

Information about a bridge package.

```typescript
interface BridgePackageInfo {
  packageName: string;
  manifest: LlmManifest;
  bridgeClass: new (config: unknown) => LlmBridge;
}
```

## 🔍 Bridge Discovery

### Automatic Discovery

The loader automatically scans your `node_modules` for packages that:

1. Have names ending with `-llm-bridge`
2. Export a `manifest()` function
3. Have a default export that implements `LlmBridge`

### Manual Bridge Registration

```typescript
// Register a custom bridge
loader.registerBridge('my-custom-bridge', {
  packageName: 'my-custom-bridge',
  manifest: myCustomManifest,
  bridgeClass: MyCustomBridge,
});
```

## ⚙️ Configuration Validation

The loader uses Zod schemas to validate bridge configurations:

```typescript
// Each bridge defines its own configuration schema
const ollamaSchema = z.object({
  host: z.string().url().optional(),
  model: z.string(),
  temperature: z.number().min(0).max(1).optional(),
});

// Loader validates config against the schema
const bridge = await loader.loadBridge('ollama-llm-bridge', {
  model: 'llama3.2',
  temperature: 0.7, // Validated against schema
});
```

## 🚦 Error Handling

The loader provides detailed error information:

```typescript
import { 
  BridgeLoadError, 
  BridgeNotFoundError, 
  ConfigurationError 
} from 'llm-bridge-loader';

try {
  const bridge = await loader.loadBridge('unknown-bridge', {});
} catch (error) {
  if (error instanceof BridgeNotFoundError) {
    console.error('Bridge not found:', error.packageName);
    console.log('Available bridges:', error.availableBridges);
  } else if (error instanceof ConfigurationError) {
    console.error('Invalid configuration:', error.message);
    console.log('Validation errors:', error.validationErrors);
  }
}
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

## 🏗️ Architecture

```
llm-bridge-loader/
├── src/
│   ├── dependency/
│   │   ├── dependency-bridge.loader.ts    # Main loader implementation
│   │   └── __tests__/
│   ├── types.ts                           # Type definitions
│   └── index.ts                          # Entry point
├── package.json
└── README.md
```

## 🔗 Related Packages

- [`llm-bridge-spec`](../llm-bridge-spec/) - Core interfaces and types
- [`ollama-llm-bridge`](../ollama-llm-bridge/) - Ollama bridge implementation
- [`openai-llm-bridge`](../openai-llm-bridge/) - OpenAI bridge implementation
- [`bedrock-llm-bridge`](../bedrock-llm-bridge/) - AWS Bedrock bridge implementation

## 🤝 기여하기

이 프로젝트는 [Git Workflow Guide](../../docs/GIT_WORKFLOW_GUIDE.md)를 따릅니다.

1. **Issues**: 새로운 기능이나 버그 리포트를 GitHub Issues에 등록
2. **브랜치 생성**: `git checkout -b feature/core-new-feature`
3. **TODO 기반 개발**: 각 작업을 TODO 단위로 커밋
   ```bash
   git commit -m "✅ [TODO 1/3] Add new loader functionality"
   ```
4. **품질 체크**: 커밋 전 반드시 확인
   ```bash
   pnpm lint && pnpm test:ci && pnpm build
   ```
5. **PR 생성**: GitHub에서 Pull Request 생성
6. **코드 리뷰**: 승인 후 Squash Merge

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

---

**Made with ❤️ by the LLM Bridge Team**