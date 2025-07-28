import { LlmBridge, LlmManifest } from 'llm-bridge-spec';
import { z } from 'zod';

export interface BridgeLoadResult<M extends LlmManifest> {
  manifest: M;
  ctor: new (config: z.infer<M['configSchema']>) => LlmBridge;
  configSchema: M['configSchema'];
}

export interface BridgeLoader {
  load<M extends LlmManifest>(pkg: string): Promise<BridgeLoadResult<M>>;
}

/**
 * 의존성 기반 로더 구현체입니다.
 * 지정된 패키지를 동적으로 가져와 매니페스트와 브릿지 클래스를 반환합니다.
 */
export class DependencyLoader implements BridgeLoader {
  async load<M extends LlmManifest>(pkg: string): Promise<BridgeLoadResult<M>> {
    // 패키지를 동적으로 import하여 브릿지 클래스를 가져옴
    const mod = await import(pkg);
    const BridgeClass = mod.default as any;

    if (!BridgeClass || typeof BridgeClass.manifest !== 'function') {
      throw new Error(`Invalid LLM bridge package: ${pkg}`);
    }

    const manifest = BridgeClass.manifest() as M;
    const ctor = BridgeClass as new (config: z.infer<M['configSchema']>) => LlmBridge;
    const configSchema = manifest.configSchema;

    return { manifest, ctor, configSchema };
  }
}

export const LlmBridgeLoader = new DependencyLoader();
