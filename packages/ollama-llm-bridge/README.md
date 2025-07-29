# Ollama LLM Bridge

Universal Ollama LLM Bridge supporting multiple models (Llama, Gemma, etc.) with a unified interface.

## 🚀 Features

- **Universal Ollama Support**: Single package supporting all Ollama models
- **Model Auto-Detection**: Automatically resolves appropriate model implementation
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Streaming Support**: Native streaming API support
- **Multi-Modal**: Image support for compatible models (Llama 3.2+)
- **Error Handling**: Robust error handling with standardized error types
- **Extensible**: Easy to add new model support

## 📦 Installation

```bash
# Using pnpm (recommended)
pnpm add ollama-llm-bridge llm-bridge-spec ollama zod

# Using npm
npm install ollama-llm-bridge llm-bridge-spec ollama zod

# Using yarn
yarn add ollama-llm-bridge llm-bridge-spec ollama zod
```

## 🏗️ Architecture

This package follows the **Abstract Model Pattern** inspired by the bedrock-llm-bridge:

```
ollama-llm-bridge/
├── models/
│   ├── base/AbstractOllamaModel     # Abstract base class
│   ├── llama/LlamaModel            # Llama implementation
│   └── gemma/GemmaModel            # Gemma implementation
├── bridge/OllamaBridge             # Main bridge class
├── factory/                        # Factory functions
└── utils/error-handler             # Error handling
```

## 🎯 Quick Start

### Basic Usage

```typescript
import { createOllamaBridge } from 'ollama-llm-bridge';

// Create bridge with auto-detected model
const bridge = createOllamaBridge({
  host: 'http://localhost:11434',
  model: 'llama3.2', // or 'gemma3n:latest'
  temperature: 0.7,
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

### Multi-Modal (Llama 3.2+)

```typescript
const response = await bridge.invoke({
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What do you see in this image?' },
        { type: 'image', data: 'base64_encoded_image_data' },
      ],
    },
  ],
});
```

## 🔧 Factory Functions

### Main Factory

```typescript
import { createOllamaBridge } from 'ollama-llm-bridge';

const bridge = createOllamaBridge({
  host: 'http://localhost:11434',
  model: 'llama3.2', // Required
  temperature: 0.7,
  num_predict: 4096,
});
```

### Convenience Factories

```typescript
import { createLlamaBridge, createGemmaBridge, createDefaultOllamaBridge } from 'ollama-llm-bridge';

// Llama with defaults
const llamaBridge = createLlamaBridge({
  model: 'llama3.2', // Optional, defaults to 'llama3.2'
  temperature: 0.8,
});

// Gemma with defaults
const gemmaBridge = createGemmaBridge({
  model: 'gemma3n:7b', // Optional, defaults to 'gemma3n:latest'
  num_predict: 1024,
});

// Default configuration (Llama 3.2)
const defaultBridge = createDefaultOllamaBridge({
  temperature: 0.5, // Override defaults
});
```

## 📋 Supported Models

### Llama Models

- `llama3.2` (with multi-modal support)
- `llama3.1`
- `llama3`
- `llama2`
- `llama`

### Gemma Models

- `gemma3n:latest`
- `gemma3n:7b`
- `gemma3n:2b`
- `gemma2:latest`
- `gemma2:7b`
- `gemma2:2b`
- `gemma:latest`
- `gemma:7b`
- `gemma:2b`

## ⚙️ Configuration

```typescript
interface OllamaBaseConfig {
  host?: string; // Default: 'http://localhost:11434'
  model: string; // Required: Model ID
  temperature?: number; // 0.0 - 1.0
  top_p?: number; // 0.0 - 1.0
  top_k?: number; // Integer >= 1
  num_predict?: number; // Max tokens to generate
  stop?: string[]; // Stop sequences
  seed?: number; // Seed for reproducibility
  stream?: boolean; // Default: false
}
```

## 🎭 Model Capabilities

```typescript
// Get model capabilities
const capabilities = bridge.getMetadata();

console.log(capabilities);
// {
//   name: 'Llama',
//   version: '3.2',
//   description: 'Ollama Llama Bridge',
//   model: 'llama3.2',
//   contextWindow: 8192,
//   maxTokens: 4096
// }

// Check model features
const features = bridge.model.getCapabilities();
console.log(features.multiModal); // true for Llama 3.2+
console.log(features.streaming); // true for all models
console.log(features.functionCalling); // false (coming soon)
```

## 🚦 Error Handling

The bridge provides comprehensive error handling with standardized error types:

```typescript
import { NetworkError, ModelNotSupportedError, ServiceUnavailableError } from 'llm-bridge-spec';

try {
  const response = await bridge.invoke(prompt);
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  } else if (error instanceof ModelNotSupportedError) {
    console.error('Unsupported model:', error.requestedModel);
    console.log('Supported models:', error.supportedModels);
  } else if (error instanceof ServiceUnavailableError) {
    console.error('Ollama server unavailable. Retry after:', error.retryAfter);
  }
}
```

## 🔄 Model Switching

```typescript
// Create bridge with initial model
const bridge = createOllamaBridge({ model: 'llama3.2' });

// Switch to different model at runtime
bridge.setModel('gemma3n:latest');

// Get current model
console.log(bridge.getCurrentModel()); // 'gemma3n:latest'

// Get supported models
console.log(bridge.getSupportedModels());
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run e2e tests (requires running Ollama server)
pnpm test:e2e
```

## 📊 Comparison with Previous Packages

| Feature          | llama3-llm-bridge    | gemma3n-llm-bridge   | ollama-llm-bridge   |
| ---------------- | -------------------- | -------------------- | ------------------- |
| Code Duplication | ❌ High              | ❌ High              | ✅ Eliminated       |
| Model Support    | 🔶 Llama only        | 🔶 Gemma only        | ✅ Universal        |
| Architecture     | 🔶 Basic             | 🔶 Basic             | ✅ Abstract Pattern |
| Extensibility    | ❌ Limited           | ❌ Limited           | ✅ Easy to extend   |
| Maintenance      | ❌ Multiple packages | ❌ Multiple packages | ✅ Single package   |

## 🔮 Roadmap

- [ ] Function Calling Support
- [ ] Batch Processing
- [ ] More Ollama Models (CodeLlama, Mistral, etc.)
- [ ] Custom Model Plugins
- [ ] Performance Optimizations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Ollama](https://ollama.ai/) API
- Follows [LLM Bridge Specification](../llm-bridge-spec/)
- Inspired by [Bedrock LLM Bridge](../bedrock-llm-bridge/) architecture

---

**Made with ❤️ by the LLM Bridge Team**
