import { describe, it, expect } from 'vitest';
import { LlmBridgeLoader } from './index';

describe('DependencyLoader', () => {
  it('should load bridge manifest from dependency', async () => {
    const result = await LlmBridgeLoader.load('openai-llm-bridge');

    expect(result.manifest.name).toBe('openai-bridge');
    expect(result.ctor).toBeDefined();
    expect(result.configSchema).toBeDefined();
  });
});
