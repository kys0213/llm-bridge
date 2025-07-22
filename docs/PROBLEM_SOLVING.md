# Problem Solving Guide

This guide covers common issues and solutions when developing LLM Bridge packages.

## Common Bridge Implementation Issues

### 1. Type Errors with LlmBridge Interface

**Problem:** TypeScript errors when implementing the LlmBridge interface

**Solutions:**

- Ensure proper imports from `llm-bridge-spec`
- Check method signatures match exactly: `invoke()` and `invokeStream?()`
- Verify return types: `Promise<LlmBridgeResponse>` and `AsyncIterable<LlmBridgeResponse>`

```typescript
// ✅ Correct implementation
import { LlmBridge, LlmBridgePrompt, InvokeOption, LlmBridgeResponse } from 'llm-bridge-spec';

export class YourBridge implements LlmBridge {
  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    // Implementation
  }
}
```

### 2. Response Format Issues

**Problem:** LLM responses don't match expected format

**Solutions:**

- Always return `content` with proper `MultiModalContent` structure
- Include `usage` information when available
- Handle `toolCalls` if supported

```typescript
// ✅ Correct response format
return {
  content: {
    contentType: 'text',
    value: responseText,
  },
  usage: {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  },
};
```

### 3. Streaming Implementation Problems

**Problem:** Streaming responses not working properly

**Solutions:**

- Use `async function*` for generator functions
- Yield individual response chunks
- Handle stream errors gracefully

```typescript
// ✅ Correct streaming implementation
async *invokeStream(prompt: LlmBridgePrompt, option?: InvokeOption): AsyncIterable<LlmBridgeResponse> {
  try {
    for await (const chunk of streamResponse) {
      yield {
        content: {
          contentType: 'text',
          value: chunk.text
        }
      };
    }
  } catch (error) {
    throw new Error(`Streaming failed: ${error.message}`);
  }
}
```

## Provider-Specific Issues

### OpenAI Bridges

- **API Key Issues:** Check environment variables and authentication
- **Rate Limits:** Implement proper error handling for 429 errors
- **Model Names:** Verify correct model identifiers

### Ollama Bridges

- **Connection Errors:** Ensure Ollama server is running on correct port
- **Model Loading:** Wait for model download/loading completion
- **Local Network:** Check firewall and localhost access

### Bedrock Bridges

- **AWS Credentials:** Configure AWS credentials properly
- **Region Settings:** Use correct AWS region for model access
- **Model IDs:** Use exact Bedrock model identifiers

## Testing Issues

### 1. E2E Test Failures

**Common Causes:**

- External service not available
- Invalid API credentials
- Network connectivity issues

**Solutions:**

- Add proper error handling in tests
- Use environment variables for configuration
- Skip tests when external dependencies unavailable

```typescript
// ✅ Robust test setup
describe('Bridge E2E Tests', () => {
  beforeAll(() => {
    if (!process.env.API_KEY) {
      console.warn('Skipping E2E tests: API_KEY not provided');
      return;
    }
  });
});
```

### 2. Build Issues

**Problem:** TypeScript compilation failures

**Solutions:**

- Check `tsconfig.json` extends path: `"extends": "../../tsconfig.json"`
- Verify dual package setup with both `tsconfig.json` and `tsconfig.esm.json`
- Ensure proper `outDir` configuration

## Configuration Problems

### 1. Manifest Schema Errors

**Problem:** Invalid manifest configuration

**Solutions:**

- Validate `configSchema` is proper JSON Schema format
- Ensure `capabilities` match actual implementation
- Use correct `schemaVersion: "1.0.0"`

### 2. Package.json Issues

**Problem:** Build or import errors

**Solutions:**

- Include both `main` and `module` fields for dual package support
- Add proper `exports` configuration
- Use `workspace:*` for internal dependencies

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

## Debugging Tips

### 1. Enable Debug Logging

- Add console logs to trace request/response flow
- Log configuration values during initialization
- Monitor network requests to external APIs

### 2. Validate Input/Output

- Check prompt structure before sending to LLM
- Validate response format before returning
- Test with minimal examples first

### 3. Isolation Testing

- Test bridge in isolation without complex prompts
- Use simple text-only requests initially
- Verify basic connectivity before advanced features

## Performance Considerations

- **Token Limits:** Respect model token limits
- **Timeout Handling:** Set appropriate request timeouts
- **Memory Usage:** Handle large responses efficiently
- **Concurrent Requests:** Be aware of provider rate limits

---

For implementation-specific issues, refer to the actual bridge implementations in the `packages/` directory for working examples.
