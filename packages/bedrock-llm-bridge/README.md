# Bedrock LLM Bridge

Universal Amazon Bedrock LLM Bridge supporting multiple models (Anthropic Claude, Meta Llama, and more) with a unified interface.

## 🚀 Features

- **Multi-Model Support**: Anthropic Claude, Meta Llama, and other Bedrock models
- **Abstract Model Pattern**: Extensible architecture for easy model addition
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Streaming Support**: Native streaming API support for supported models
- **AWS Integration**: Seamless AWS SDK integration with Bedrock Runtime
- **Error Handling**: Robust error handling with standardized error types
- **Flexible Configuration**: Easy AWS credential and region management
- **Model Switching**: Runtime model switching capabilities

## 📦 Installation

```bash
# pnpm (권장)
pnpm add bedrock-llm-bridge llm-bridge-spec @aws-sdk/client-bedrock-runtime @smithy/node-http-handler zod

# npm
npm install bedrock-llm-bridge llm-bridge-spec @aws-sdk/client-bedrock-runtime @smithy/node-http-handler zod

# yarn
yarn add bedrock-llm-bridge llm-bridge-spec @aws-sdk/client-bedrock-runtime @smithy/node-http-handler zod
```

## 🏗️ Architecture

This package follows the **Abstract Model Pattern** for maximum extensibility:

```
bedrock-llm-bridge/
├── models/
│   ├── base/AbstractModel           # Abstract base class
│   ├── anthropic/AnthropicModel     # Claude implementation
│   └── meta/MetaModel              # Llama implementation
├── bridge/BedrockBridge            # Main bridge class
├── factory/                        # Factory functions
└── utils/error-handler             # Error handling
```

## 🎯 Quick Start

### Basic Usage with Claude

```typescript
import { createBedrockBridge } from 'bedrock-llm-bridge';

// Create bridge with Anthropic Claude
const bridge = createBedrockBridge({
  region: 'us-east-1',
  model: 'anthropic.claude-3-sonnet-20240229-v1:0',
  maxTokens: 1000,
  temperature: 0.7,
});

// Simple chat
const response = await bridge.invoke({
  messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello!' }] }],
});

console.log(response.choices[0].message.content[0].text);
```

### Using Meta Llama

```typescript
import { createBedrockBridge } from 'bedrock-llm-bridge';

// Create bridge with Meta Llama
const bridge = createBedrockBridge({
  region: 'us-west-2',
  model: 'meta.llama2-70b-chat-v1',
  maxTokens: 2048,
  temperature: 0.6,
});

const response = await bridge.invoke({
  messages: [{ role: 'user', content: [{ type: 'text', text: 'Explain quantum computing' }] }],
});
```

### Streaming (Claude 3 Models)

```typescript
// Streaming chat with Claude 3
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

## 🔧 Factory Functions

### Main Factory

```typescript
import { createBedrockBridge } from 'bedrock-llm-bridge';

const bridge = createBedrockBridge({
  region: 'us-east-1',                    // AWS region
  model: 'anthropic.claude-3-sonnet-20240229-v1:0', // Model ID
  credentials: {                          // Optional: Custom credentials
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
  },
  maxTokens: 1000,
  temperature: 0.7,
});
```

### Convenience Factories

```typescript
import { 
  createAnthropicBridge,
  createMetaBridge,
  createDefaultBedrockBridge 
} from 'bedrock-llm-bridge';

// Anthropic Claude with defaults
const claudeBridge = createAnthropicBridge({
  region: 'us-east-1',
  model: 'anthropic.claude-3-sonnet-20240229-v1:0', // Optional
  temperature: 0.8,
});

// Meta Llama with defaults
const llamaBridge = createMetaBridge({
  region: 'us-west-2',
  model: 'meta.llama2-70b-chat-v1', // Optional
  maxTokens: 2048,
});

// Default configuration (Claude 3 Sonnet)
const defaultBridge = createDefaultBedrockBridge({
  region: 'us-east-1',
  temperature: 0.5, // Override defaults
});
```

## 📋 Supported Models

### Anthropic Claude Models

- `anthropic.claude-3-opus-20240229-v1:0` - Most capable Claude 3 model
- `anthropic.claude-3-sonnet-20240229-v1:0` - Balanced performance and speed
- `anthropic.claude-3-haiku-20240307-v1:0` - Fastest Claude 3 model
- `anthropic.claude-v2:1` - Claude 2.1
- `anthropic.claude-v2` - Claude 2.0
- `anthropic.claude-instant-v1` - Fast and cost-effective

### Meta Llama Models

- `meta.llama2-70b-chat-v1` - Llama 2 70B Chat
- `meta.llama2-13b-chat-v1` - Llama 2 13B Chat
- `meta.llama2-7b-chat-v1` - Llama 2 7B Chat

### Amazon Titan Models (Coming Soon)

- `amazon.titan-text-express-v1`
- `amazon.titan-text-lite-v1`

## ⚙️ Configuration

```typescript
interface BedrockConfig {
  region: string;                    // AWS region (required)
  model: string;                     // Model ID (required)
  credentials?: {                    // AWS credentials (optional)
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  maxTokens?: number;               // Maximum tokens to generate
  temperature?: number;             // 0.0 - 1.0
  topP?: number;                   // 0.0 - 1.0
  topK?: number;                   // Integer >= 1 (for supported models)
  stopSequences?: string[];        // Stop sequences
}
```

## 🔐 AWS Authentication

### Method 1: Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

```typescript
// No credentials needed in config
const bridge = createBedrockBridge({
  region: 'us-east-1',
  model: 'anthropic.claude-3-sonnet-20240229-v1:0',
});
```

### Method 2: AWS Credentials File

```bash
# ~/.aws/credentials
[default]
aws_access_key_id = your-access-key
aws_secret_access_key = your-secret-key
```

### Method 3: IAM Roles (EC2/Lambda)

```typescript
// Automatic credential detection
const bridge = createBedrockBridge({
  region: 'us-east-1',
  model: 'anthropic.claude-3-sonnet-20240229-v1:0',
});
```

### Method 4: Explicit Credentials

```typescript
const bridge = createBedrockBridge({
  region: 'us-east-1',
  model: 'anthropic.claude-3-sonnet-20240229-v1:0',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

## 🎭 Model Capabilities

```typescript
// Get model capabilities
const metadata = await bridge.getMetadata();

console.log(metadata);
// {
//   name: 'Anthropic Claude',
//   version: '3.0',
//   provider: 'Anthropic',
//   model: 'claude-3-sonnet-20240229-v1:0',
//   contextWindow: 200000,
//   maxTokens: 4096
// }

// Check specific capabilities
const manifest = bridge.getManifest();
console.log(manifest.capabilities.supportsStreaming);    // true for Claude 3
console.log(manifest.capabilities.supportsMultiTurn);    // true
console.log(manifest.capabilities.supportsToolCall);     // false (coming soon)
```

## 🚦 Error Handling

The bridge provides comprehensive error handling with standardized error types:

```typescript
import { 
  ServiceUnavailableError,
  InvalidRequestError,
  AuthenticationError,
  ModelNotSupportedError,
  NetworkError
} from 'llm-bridge-spec';

try {
  const response = await bridge.invoke(prompt);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('AWS credentials invalid or insufficient permissions');
  } else if (error instanceof ModelNotSupportedError) {
    console.error('Model not available in region:', error.requestedModel);
    console.log('Supported models:', error.supportedModels);
  } else if (error instanceof ServiceUnavailableError) {
    console.error('Bedrock service temporarily unavailable');
    console.log('Retry after:', error.retryAfter);
  } else if (error instanceof InvalidRequestError) {
    console.error('Invalid request parameters:', error.message);
  }
}
```

## 🔄 Model Switching

```typescript
// Create bridge with initial model
const bridge = createBedrockBridge({ 
  region: 'us-east-1',
  model: 'anthropic.claude-3-sonnet-20240229-v1:0'
});

// Switch to different model at runtime
bridge.setModel('anthropic.claude-3-haiku-20240307-v1:0');

// Get current model
console.log(bridge.getCurrentModel()); 

// Get supported models for current region
console.log(bridge.getSupportedModels());
```

## 🌍 Multi-Region Support

```typescript
// Use different regions for different models
const usEastBridge = createBedrockBridge({
  region: 'us-east-1',
  model: 'anthropic.claude-3-sonnet-20240229-v1:0',
});

const usWestBridge = createBedrockBridge({
  region: 'us-west-2',
  model: 'meta.llama2-70b-chat-v1',
});

// Check model availability by region
const availableModels = await bridge.getModelsForRegion('us-east-1');
console.log(availableModels);
```

## 💰 Cost Optimization

```typescript
// Monitor token usage for cost tracking
const response = await bridge.invoke(prompt);

if (response.usage) {
  console.log('Input tokens:', response.usage.promptTokens);
  console.log('Output tokens:', response.usage.completionTokens);
  
  // Estimate costs (example rates for Claude 3 Sonnet)
  const inputCost = response.usage.promptTokens * 0.003 / 1000;   // $0.003 per 1K tokens
  const outputCost = response.usage.completionTokens * 0.015 / 1000; // $0.015 per 1K tokens
  console.log(`Estimated cost: $${(inputCost + outputCost).toFixed(6)}`);
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
pnpm test bedrock-bridge.test.ts
```

## 🔧 Adding New Models

The abstract model pattern makes it easy to add support for new Bedrock models:

```typescript
// 1. Create new model class
export class NewModelBridge extends AbstractModel {
  protected getModelFamily(): string {
    return 'new-provider';
  }

  protected async transformRequest(prompt: LlmBridgePrompt, options?: InvokeOption) {
    // Transform to provider-specific format
  }

  protected transformResponse(response: any): LlmBridgeResponse {
    // Transform from provider-specific format
  }
}

// 2. Register in factory
export function createNewModelBridge(config: BedrockConfig) {
  return new BedrockBridge(new NewModelBridge(config));
}
```

## 📊 Performance Considerations

### Model Selection

```typescript
// For speed: Use Claude 3 Haiku
const fastBridge = createBedrockBridge({
  region: 'us-east-1',
  model: 'anthropic.claude-3-haiku-20240307-v1:0',
});

// For capability: Use Claude 3 Opus
const capableBridge = createBedrockBridge({
  region: 'us-east-1',
  model: 'anthropic.claude-3-opus-20240229-v1:0',
});

// For balance: Use Claude 3 Sonnet
const balancedBridge = createBedrockBridge({
  region: 'us-east-1',
  model: 'anthropic.claude-3-sonnet-20240229-v1:0',
});
```

### Streaming for Long Responses

```typescript
// Use streaming for long content
if (expectedResponseLength > 500) {
  const stream = bridge.invokeStream(prompt);
  // Process chunks as they arrive
} else {
  const response = await bridge.invoke(prompt);
}
```

## 🔗 Related Packages

- [`llm-bridge-spec`](../llm-bridge-spec/) - Core interfaces and types
- [`ollama-llm-bridge`](../ollama-llm-bridge/) - Ollama bridge implementation
- [`openai-llm-bridge`](../openai-llm-bridge/) - OpenAI bridge implementation
- [`llm-bridge-loader`](../llm-bridge-loader/) - Dynamic bridge loader

## 🔮 Roadmap

- [ ] Amazon Titan Model Support
- [ ] Cohere Model Integration
- [ ] Function Calling for Claude 3
- [ ] Image Generation with Titan Image
- [ ] Batch Processing API
- [ ] Advanced Prompt Caching

## 🤝 기여하기

이 프로젝트는 [Git Workflow Guide](../../docs/GIT_WORKFLOW_GUIDE.md)를 따릅니다.

1. **Issues**: 새로운 기능이나 버그 리포트를 GitHub Issues에 등록
2. **브랜치 생성**: `git checkout -b feature/core-new-feature`
3. **TODO 기반 개발**: 각 작업을 TODO 단위로 커밋
   ```bash
   git commit -m "✅ [TODO 1/3] Add new Bedrock model support"
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

- Built with [AWS Bedrock](https://aws.amazon.com/bedrock/) API
- Follows [LLM Bridge Specification](../llm-bridge-spec/)
- Abstract Model Pattern inspired by enterprise-grade architectures

---

**Made with ❤️ by the LLM Bridge Team**