import { describe, it, expect } from 'vitest';
import { DependencyBridgeLoader } from '../dependency-bridge.loader';

describe('DependencyLoader', () => {
  it('should load bridge manifest from dependency', async () => {
    const loader = new DependencyBridgeLoader();
    const result = await loader.load('openai-llm-bridge');

    expect(result.manifest.name).toBe('openai-bridge');
    expect(result.ctor).toBeDefined();
    expect(result.configSchema).toBeDefined();
    expect(Array.isArray(result.manifest.models)).toBe(true);
    expect(result.manifest.models[0].contextWindowTokens).toBeGreaterThan(0);
    expect(result.manifest.models[0].pricing).toBeDefined();
  });
});
