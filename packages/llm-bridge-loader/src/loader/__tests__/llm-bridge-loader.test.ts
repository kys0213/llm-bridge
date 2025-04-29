import { LlmBridgeLoader } from '../llm-bridge.loader';
import { describe, it, expect } from 'vitest';

describe('LlmBridgeLoader', () => {
  it('should load the manifest', async () => {
    const { manifest, ctor, configSchema } = await LlmBridgeLoader.load('@llm-bridge/llama3-with-ollama');
    expect(manifest).toBeDefined();

    const bridge = new ctor();

    const response = await bridge.invoke({
      messages: [
        {
          role: 'user',
          content: {
            contentType: 'text',
            value: 'Hello, world!',
          },
        },
      ],
    });

    console.log(response);

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(response.content.contentType).toBe('text');
    expect(typeof response.content.value).toBe('string');
    expect((response.content.value as string).length).toBeGreaterThan(0);
  });
});
