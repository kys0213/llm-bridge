import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ZodObject } from 'zod';
import { LlmBridge, LlmManifest, SDK } from 'llm-bridge-spec';

export interface LoadedBridge<
  TBridge extends LlmBridge = LlmBridge,
  TConfig = unknown,
> {
  ctor: SDK.EnhancedBridgeClass<TBridge, TConfig>;
  manifest: LlmManifest;
  configSchema: ZodObject;
  create: (config: TConfig) => TBridge;
}

export interface BridgeLoader {
  load<TB extends LlmBridge = LlmBridge, TC = unknown>(
    specifier: string,
  ): Promise<LoadedBridge<TB, TC>>;
}

/**
 * Bridge loader that resolves packages from Node.js dependencies or file paths.
 */
export class DependencyBridgeLoader implements BridgeLoader {
  async load<TB extends LlmBridge = LlmBridge, TC = unknown>(
    specifier: string,
  ): Promise<LoadedBridge<TB, TC>> {
    const target =
      specifier.startsWith('.') || specifier.startsWith('/')
        ? pathToFileURL(path.resolve(specifier)).href
        : specifier;

    const mod = await import(target);
    const Bridge = mod.default as SDK.EnhancedBridgeClass<TB, TC>;
    const manifest = Bridge.manifest();

    return {
      ctor: Bridge,
      create: Bridge.create,
      manifest,
      configSchema: manifest.configSchema,
    };
  }
}
