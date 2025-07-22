# Test Guide

This document provides guidelines for writing and running tests in the LLM Bridge project.

## Testing Framework

- **Framework**: Vitest
- **Test Types**: Unit tests and E2E tests
- **Coverage**: Use `@vitest/coverage-v8` for coverage reports

## Test Structure

### Unit Tests

- Place unit tests next to the source files with `.test.ts` extension
- Test individual functions and classes in isolation

### E2E Tests

- Place E2E tests in `src/__tests__/` directory with `.e2e.test.ts` extension
- Test complete workflows and integrations with external services

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run tests for specific package
cd packages/llama3-llm-bridge
pnpm test
```

## Test Naming Conventions

- Test files: `*.test.ts` for unit tests, `*.e2e.test.ts` for E2E tests
- Test descriptions: Use descriptive names that explain what is being tested
- Group related tests using `describe` blocks

## Example Test Structure

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { YourBridge } from '../bridge/your-bridge';

describe('YourBridge', () => {
  let bridge: YourBridge;

  beforeAll(() => {
    bridge = new YourBridge();
  });

  it('should generate text response', async () => {
    const response = await bridge.invoke({
      messages: [
        {
          role: 'user',
          content: {
            contentType: 'text',
            value: 'Hello, how are you?',
          },
        },
      ],
    });

    expect(response).toBeDefined();
    expect(response.content.contentType).toBe('text');
    expect(typeof response.content.value).toBe('string');
  });
});
```

## Guidelines

1. **Test Real Functionality**: Focus on testing actual behavior, not implementation details
2. **Use Meaningful Assertions**: Test the important aspects of the response
3. **Mock External Dependencies**: Use mocks for external APIs when appropriate
4. **Keep Tests Independent**: Each test should be able to run independently
5. **Write Descriptive Test Names**: Test names should clearly indicate what is being tested
