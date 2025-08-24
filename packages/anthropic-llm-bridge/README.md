# Anthropic LLM Bridge

Universal Anthropic Claude LLM Bridge supporting all Claude models (Opus 4.1, Sonnet 4, Sonnet 3.7, Haiku 3.5) with a unified interface.

## 🚀 Features

- **Universal Claude Support**: Single package supporting all Claude models
- **Latest API Integration**: Built with Anthropic SDK v0.30+
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Streaming Support**: Native streaming API support
- **Tool Calling**: Support for Anthropic tool calling capabilities
- **Long Context**: 1M token context window support (Sonnet 4)
- **Extended Output**: 128K output tokens with beta headers
- **Error Handling**: Robust error handling with standardized error types
- **Flexible Configuration**: Easy configuration management
- **Token Usage Tracking**: Built-in token consumption monitoring

## 📦 Installation

```bash
# pnpm (권장)
pnpm add anthropic-llm-bridge llm-bridge-spec @anthropic-ai/sdk zod

# npm
npm install anthropic-llm-bridge llm-bridge-spec @anthropic-ai/sdk zod

# yarn
yarn add anthropic-llm-bridge llm-bridge-spec @anthropic-ai/sdk zod
```

## 🎯 Quick Start

### Basic Usage

```typescript
import { createAnthropicBridge } from 'anthropic-llm-bridge';

// Create bridge with API key
const bridge = createAnthropicBridge({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4',
  temperature: 0.7,
  maxTokens: 8192,
});

// Simple chat
const response = await bridge.invoke({
  messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello!' }] }],
});

console.log(response.content.value);
```

### Streaming

```typescript
// Streaming chat
const stream = bridge.invokeStream({
  messages: [{ role: 'user', content: [{ type: 'text', text: 'Tell me a story' }] }],
});

for await (const chunk of stream) {
  const text = chunk.content.value;
  if (text) {
    process.stdout.write(text);
  }
}
```

### Long Context (1M tokens)

```typescript
// Enable 1M context window for Sonnet 4
const bridge = createAnthropicBridge({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4',
  useLongContext: true,
  useExtendedOutput: true,
});

// Process large documents
const response = await bridge.invoke({
  messages: [{ 
    role: 'user', 
    content: [{ type: 'text', text: `Analyze this large codebase: ${largecodebase}` }] 
  }],
});
```

### Tool Calling

```typescript
const response = await bridge.invoke(
  {
    messages: [
      { role: 'user', content: [{ type: 'text', text: "What's the weather like in Seoul?" }] },
    ],
  },
  {
    tools: [
      {
        name: 'get_weather',
        description: 'Get the current weather in a given location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'The city name' },
          },
          required: ['location'],
        },
      },
    ],
  }
);

// Handle tool calls
if (response.toolCalls) {
  for (const toolCall of response.toolCalls) {
    console.log(`Function: ${toolCall.name}`);
    console.log(`Arguments:`, toolCall.arguments);
  }
}
```

## 🔧 Factory Functions

### Main Factory

```typescript
import { createAnthropicBridge } from 'anthropic-llm-bridge';

const bridge = createAnthropicBridge({
  apiKey: process.env.ANTHROPIC_API_KEY, // Required
  model: 'claude-sonnet-4', // Required
  temperature: 0.7,
  maxTokens: 8192,
  topP: 1.0,
  useLongContext: true,
  useExtendedOutput: true,
});
```

### Convenience Factories

```typescript
import { 
  createClaudeOpusBridge, 
  createClaudeSonnetBridge, 
  createClaudeHaikuBridge,
  createDefaultAnthropicBridge 
} from 'anthropic-llm-bridge';

// Claude Opus 4.1 with defaults (최고 성능)
const opusBridge = createClaudeOpusBridge({
  apiKey: process.env.ANTHROPIC_API_KEY,
  temperature: 0.8,
});

// Claude Sonnet 4 with defaults (균형잡힌 성능)
const sonnetBridge = createClaudeSonnetBridge({
  apiKey: process.env.ANTHROPIC_API_KEY,
  temperature: 0.7,
  useLongContext: true,
});

// Claude Haiku 3.5 with defaults (빠르고 경량)
const haikuBridge = createClaudeHaikuBridge({
  apiKey: process.env.ANTHROPIC_API_KEY,
  temperature: 0.5,
});

// Default configuration (Sonnet 4)
const defaultBridge = createDefaultAnthropicBridge({
  apiKey: process.env.ANTHROPIC_API_KEY,
  temperature: 0.5, // Override defaults
});
```

## 📋 Supported Models

### Claude Opus 4.1
- `claude-opus-4.1` - Highest intelligence and capability
- Context: 200K tokens
- Max output: 128K tokens
- Pricing: $15/$75 per 1M tokens

### Claude Sonnet 4
- `claude-sonnet-4` - Balanced performance and speed
- Context: 200K tokens (1M with beta header)
- Max output: 128K tokens
- Pricing: $3/$15 per 1M tokens ($6/$22.50 for >200K context)

### Claude Sonnet 3.7
- `claude-sonnet-3.7` - Previous generation
- Context: 200K tokens
- Max output: 8K tokens
- Pricing: $3/$15 per 1M tokens

### Claude Haiku 3.5
- `claude-haiku-3.5` - Fast and lightweight
- Context: 200K tokens
- Max output: 8K tokens
- Pricing: $0.8/$4 per 1M tokens

## ⚙️ Configuration

```typescript
interface AnthropicConfig {
  apiKey: string; // Anthropic API key (required)
  model: string; // Model name (required)
  temperature?: number; // 0.0 - 1.0
  maxTokens?: number; // Maximum tokens to generate
  topP?: number; // 0.0 - 1.0
  stopSequences?: string[]; // Stop sequences
  useLongContext?: boolean; // Enable 1M context for Sonnet 4
  useExtendedOutput?: boolean; // Enable 128K output tokens
  baseURL?: string; // Custom API base URL
  timeout?: number; // Request timeout
  maxRetries?: number; // Max retry attempts
}
```

## 🎭 Model Capabilities

```typescript
// Get model capabilities
const metadata = await bridge.getMetadata();

console.log(metadata);
// {
//   name: 'Anthropic Claude Sonnet',
//   version: '4',
//   description: 'Anthropic Claude Sonnet Bridge Implementation',
//   model: 'claude-sonnet-4',
//   contextWindow: 200000,
//   maxTokens: 128000
// }

// Check specific capabilities
const manifest = bridge.getManifest();
console.log(manifest.capabilities.supportsToolCall); // true
console.log(manifest.capabilities.supportsStreaming); // true
console.log(manifest.capabilities.supportsVision); // false
```

## 💰 Token Usage Monitoring

```typescript
const response = await bridge.invoke(prompt);

// Monitor token usage
if (response.usage) {
  console.log('Prompt tokens:', response.usage.promptTokens);
  console.log('Completion tokens:', response.usage.completionTokens);
  console.log('Total tokens:', response.usage.totalTokens);

  // Calculate cost for Sonnet 4
  const promptCost = (response.usage.promptTokens * 3.0) / 1000000; // $3 per 1M tokens
  const completionCost = (response.usage.completionTokens * 15.0) / 1000000; // $15 per 1M tokens
  console.log(`Approximate cost: $${(promptCost + completionCost).toFixed(6)}`);
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

# Run specific test
pnpm test anthropic-bridge.test.ts
```

## 🏗️ Architecture

```
anthropic-llm-bridge/
├── src/
│   ├── bridge/
│   │   ├── anthropic-bridge.ts       # Main bridge implementation
│   │   ├── anthropic-config.ts       # Configuration management
│   │   ├── anthropic-factory.ts      # Factory functions
│   │   ├── anthropic-manifest.ts     # Manifest definition
│   │   └── anthropic-models.ts       # Model definitions
│   ├── __tests__/
│   │   └── anthropic-bridge.test.ts  # Unit tests
│   └── index.ts                      # Entry point
├── package.json
└── README.md
```

## 🔗 Related Packages

- [`llm-bridge-spec`](../llm-bridge-spec/) - Core interfaces and types
- [`openai-llm-bridge`](../openai-llm-bridge/) - OpenAI bridge implementation
- [`ollama-llm-bridge`](../ollama-llm-bridge/) - Ollama bridge implementation
- [`llm-bridge-loader`](../llm-bridge-loader/) - Dynamic bridge loader

## 📊 Performance Considerations

### Model Selection

```typescript
// For complex reasoning tasks
const opusBridge = createClaudeOpusBridge({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// For balanced performance
const sonnetBridge = createClaudeSonnetBridge({
  apiKey: process.env.ANTHROPIC_API_KEY,
  useLongContext: true, // Enable 1M context
});

// For quick responses
const haikuBridge = createClaudeHaikuBridge({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

### Context Window Optimization

```typescript
// Use long context for large documents
const bridge = createAnthropicBridge({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4',
  useLongContext: true, // 1M context window
  useExtendedOutput: true, // 128K output
});
```

## 🤝 기여하기

이 프로젝트는 [Git Workflow Guide](../../docs/GIT_WORKFLOW_GUIDE.md)를 따릅니다.

1. **Issues**: 새로운 기능이나 버그 리포트를 GitHub Issues에 등록
2. **브랜치 생성**: `git checkout -b feature/anthropic-new-feature`
3. **TODO 기반 개발**: 각 작업을 TODO 단위로 커밋
4. **품질 체크**: 커밋 전 반드시 확인
   ```bash
   pnpm lint && pnpm test:ci && pnpm build
   ```
5. **PR 생성**: GitHub에서 Pull Request 생성
6. **코드 리뷰**: 승인 후 Squash Merge

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🙏 Acknowledgments

- Built with [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) v0.30+
- Follows [LLM Bridge Specification](../llm-bridge-spec/)
- Inspired by the universal bridge architecture

---

**Made with ❤️ by the LLM Bridge Team**