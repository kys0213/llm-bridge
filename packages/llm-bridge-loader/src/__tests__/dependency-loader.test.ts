import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DependencyBridgeLoader } from '../index';

describe('DependencyBridgeLoader', () => {
  it('loads OpenAI bridge package', async () => {
    const loader = new DependencyBridgeLoader();
    const specifier = pathToFileURL(
      path.resolve(__dirname, '../../../openai-llm-bridge/src/index.ts'),
    ).href;

    const result = await loader.load(specifier);

    expect(result.manifest.name).toBe('openai-bridge');

    const instance = result.create(result.configSchema.parse({ apiKey: 'test' }));
    expect(instance).toBeInstanceOf(result.ctor);
  });
});
