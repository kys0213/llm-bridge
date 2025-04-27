import { LlmManifest } from '@agentos/llm-bridge-spec';
import { LlmBridgeConstructor } from './types';
import { z } from 'zod';
import { parseLlmBridgeConfig } from './parseLlmBridgeConfig';

export class LlmBridgeLoader {
  static async load(name: string): Promise<{
    manifest: LlmManifest;
    configSchema: z.ZodTypeAny;
    ctor: LlmBridgeConstructor<any[]>;
  }> {
    const bridge = await import(`${name}`);

    return {
      manifest: bridge.manifest(),
      configSchema: parseLlmBridgeConfig(bridge.manifest()),
      ctor: bridge.default,
    };
  }
}
