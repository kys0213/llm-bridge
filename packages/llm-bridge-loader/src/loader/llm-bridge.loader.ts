import { LlmManifest } from 'llm-bridge-spec';
import { LlmBridgeConstructor } from './types';
import { z } from 'zod';
import { parseLlmBridgeConfig } from './parseLlmBridgeConfig';

export class LlmBridgeLoader {
  static async load(name: string): Promise<{
    manifest: LlmManifest;
    configSchema: z.AnyZodObject;
    ctor: LlmBridgeConstructor<any[]>;
  }> {
    const bridge = (await import(`${name}`)) as {
      manifest: () => LlmManifest;
      default: LlmBridgeConstructor<any[]>;
    };

    return {
      manifest: bridge.manifest(),
      configSchema: parseLlmBridgeConfig(bridge.manifest()),
      ctor: bridge.default,
    };
  }
}
