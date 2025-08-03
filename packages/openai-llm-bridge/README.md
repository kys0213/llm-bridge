# OpenAI LLM Bridge

Universal OpenAI LLM Bridge supporting all OpenAI models (GPT-4, GPT-3.5, etc.) with a unified interface.

## 🚀 Features

- **Universal OpenAI Support**: Single package supporting all OpenAI models
- **Latest API Integration**: Built with OpenAI API v4+
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Streaming Support**: Native streaming API support
- **Function Calling**: Support for OpenAI function calling capabilities
- **Error Handling**: Robust error handling with standardized error types
- **Flexible Configuration**: Easy configuration management
- **Token Usage Tracking**: Built-in token consumption monitoring

## 📦 Installation

```bash
# pnpm (권장)
pnpm add openai-llm-bridge llm-bridge-spec openai zod

# npm
npm install openai-llm-bridge llm-bridge-spec openai zod

# yarn
yarn add openai-llm-bridge llm-bridge-spec openai zod
```

## 🎯 Quick Start

### Basic Usage

```typescript
import { createOpenAIBridge } from 'openai-llm-bridge';

// Create bridge with API key
const bridge = createOpenAIBridge({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
});

// Simple chat
const response = await bridge.invoke({
  messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello!' }] }],
});

console.log(response.choices[0].message.content[0].text);
```

### Streaming

```typescript
// Streaming chat
const stream = bridge.invokeStream({
  messages: [{ role: 'user', content: [{ type: 'text', text: 'Tell me a story' }] }],
});

for await (const chunk of stream) {
  const text = chunk.choices[0]?.message?.content[0]?.text;
  if (text) {
    process.stdout.write(text);
  }
}
```

### Function Calling

```typescript
const response = await bridge.invoke(
  {
    messages: [
      { role: 'user', content: [{ type: 'text', text: 'What\'s the weather like in Seoul?' }] },
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

// Handle function calls
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
import { createOpenAIBridge } from 'openai-llm-bridge';

const bridge = createOpenAIBridge({
  apiKey: process.env.OPENAI_API_KEY,  // Required
  model: 'gpt-4',                      // Required
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
});
```

### Convenience Factories

```typescript
import { 
  createGPT4Bridge, 
  createGPT35Bridge, 
  createDefaultOpenAIBridge 
} from 'openai-llm-bridge';

// GPT-4 with defaults
const gpt4Bridge = createGPT4Bridge({
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.8,
});

// GPT-3.5 Turbo with defaults
const gpt35Bridge = createGPT35Bridge({
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
});

// Default configuration (GPT-4)
const defaultBridge = createDefaultOpenAIBridge({
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.5, // Override defaults
});
```

## 📋 Supported Models

### GPT-4 Family

- `gpt-4` - Latest GPT-4 model
- `gpt-4-turbo` - GPT-4 Turbo with improved performance
- `gpt-4-turbo-preview` - Preview version of GPT-4 Turbo
- `gpt-4-vision-preview` - GPT-4 with vision capabilities
- `gpt-4-32k` - GPT-4 with extended context window

### GPT-3.5 Family

- `gpt-3.5-turbo` - Latest GPT-3.5 Turbo
- `gpt-3.5-turbo-16k` - GPT-3.5 Turbo with extended context
- `gpt-3.5-turbo-instruct` - Instruction-following variant

## ⚙️ Configuration

```typescript
interface OpenAIConfig {
  apiKey: string;           // OpenAI API key (required)
  model: string;            // Model name (required)
  temperature?: number;     // 0.0 - 2.0
  maxTokens?: number;       // Maximum tokens to generate
  topP?: number;           // 0.0 - 1.0
  frequencyPenalty?: number; // -2.0 - 2.0
  presencePenalty?: number;  // -2.0 - 2.0
  stopSequence?: string[];   // Stop sequences
  logitBias?: Record<string, number>; // Token bias
  user?: string;            // User identifier
  baseURL?: string;         // Custom API base URL
  organization?: string;    // OpenAI organization ID
}
```

## 🎭 Model Capabilities

```typescript
// Get model capabilities
const metadata = await bridge.getMetadata();

console.log(metadata);
// {
//   name: 'OpenAI GPT-4',
//   version: '4.0',
//   provider: 'OpenAI',
//   model: 'gpt-4',
//   contextWindow: 8192,
//   maxTokens: 4096
// }

// Check specific capabilities
const manifest = bridge.getManifest();
console.log(manifest.capabilities.supportsToolCall);     // true
console.log(manifest.capabilities.supportsStreaming);    // true
console.log(manifest.capabilities.supportsVision);       // depends on model
```

## 🚦 Error Handling

The bridge provides comprehensive error handling with standardized error types:

```typescript
import { 
  RateLimitError,
  QuotaExceededError, 
  AuthenticationError,
  InvalidRequestError,
  ServiceUnavailableError
} from 'llm-bridge-spec';

try {
  const response = await bridge.invoke(prompt);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error('Rate limited. Retry after:', error.retryAfter);
  } else if (error instanceof QuotaExceededError) {
    console.error('Quota exceeded:', error.quotaType);
    console.log('Reset time:', error.resetTime);
  } else if (error instanceof AuthenticationError) {
    console.error('Invalid API key or authentication failed');
  } else if (error instanceof InvalidRequestError) {
    console.error('Invalid request:', error.message);
    console.log('Missing fields:', error.missingFields);
  }
}
```

## 💰 Token Usage Monitoring

```typescript
const response = await bridge.invoke(prompt);

// Monitor token usage
if (response.usage) {
  console.log('Prompt tokens:', response.usage.promptTokens);
  console.log('Completion tokens:', response.usage.completionTokens);
  console.log('Total tokens:', response.usage.totalTokens);
  
  // Calculate approximate cost (example rates)
  const promptCost = response.usage.promptTokens * 0.03 / 1000;  // $0.03 per 1K tokens
  const completionCost = response.usage.completionTokens * 0.06 / 1000;  // $0.06 per 1K tokens
  console.log(`Approximate cost: $${(promptCost + completionCost).toFixed(4)}`);
}
```

## 🔄 Model Switching

```typescript
// Create bridge with initial model
const bridge = createOpenAIBridge({ 
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4' 
});

// Switch to different model at runtime
bridge.setModel('gpt-3.5-turbo');

// Get current model
console.log(bridge.getCurrentModel()); // 'gpt-3.5-turbo'

// Get supported models
console.log(bridge.getSupportedModels());
```

## 🌐 Custom Endpoints

```typescript
// Use custom OpenAI-compatible endpoint
const bridge = createOpenAIBridge({
  apiKey: 'your-api-key',
  model: 'gpt-4',
  baseURL: 'https://your-custom-endpoint.com/v1',
  organization: 'your-org-id',
});
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
pnpm test openai-bridge.test.ts
```

## 🏗️ Architecture

```
openai-llm-bridge/
├── src/
│   ├── bridge/
│   │   ├── openai-bridge.ts          # Main bridge implementation
│   │   ├── openai-config.ts          # Configuration management
│   │   ├── openai-factory.ts         # Factory functions
│   │   ├── openai-manifest.ts        # Manifest definition
│   │   └── openai-models.ts          # Model definitions
│   ├── __tests__/
│   │   └── openai-bridge.test.ts     # Unit tests
│   └── index.ts                      # Entry point
├── package.json
└── README.md
```

## 🔗 Related Packages

- [`llm-bridge-spec`](../llm-bridge-spec/) - Core interfaces and types
- [`ollama-llm-bridge`](../ollama-llm-bridge/) - Ollama bridge implementation
- [`bedrock-llm-bridge`](../bedrock-llm-bridge/) - AWS Bedrock bridge implementation
- [`llm-bridge-loader`](../llm-bridge-loader/) - Dynamic bridge loader

## 📊 Performance Considerations

### Streaming vs Regular Calls

```typescript
// For long responses, use streaming
if (expectedResponseLength > 100) {
  const stream = bridge.invokeStream(prompt);
  // Process chunks as they arrive
} else {
  const response = await bridge.invoke(prompt);
  // Process complete response
}
```

### Token Optimization

```typescript
// Monitor and optimize token usage
const response = await bridge.invoke(prompt, {
  maxTokens: 500,  // Limit response length
  temperature: 0.1, // Reduce randomness for consistent responses
});
```

## 🔮 Roadmap

- [ ] GPT-4 Vision API Integration
- [ ] DALL-E Image Generation Support
- [ ] Whisper Audio Transcription
- [ ] Fine-tuned Model Support
- [ ] Batch Processing API
- [ ] Advanced Function Calling Features

## 🤝 기여하기

이 프로젝트는 [Git Workflow Guide](../../docs/GIT_WORKFLOW_GUIDE.md)를 따릅니다.

1. **Issues**: 새로운 기능이나 버그 리포트를 GitHub Issues에 등록
2. **브랜치 생성**: `git checkout -b feature/core-new-feature`
3. **TODO 기반 개발**: 각 작업을 TODO 단위로 커밋
   ```bash
   git commit -m "✅ [TODO 1/3] Add new OpenAI model support"
   ```
4. **품질 체크**: 커밋 전 반드시 확인
   ```bash
   pnpm lint && pnpm test:ci && pnpm build
   ```
5. **PR 생성**: GitHub에서 Pull Request 생성
6. **코드 리뷰**: 승인 후 Squash Merge

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🙏 Acknowledgments

- Built with [OpenAI API](https://openai.com/api/) v4+
- Follows [LLM Bridge Specification](../llm-bridge-spec/)
- Inspired by the universal bridge architecture

---

**Made with ❤️ by the LLM Bridge Team**