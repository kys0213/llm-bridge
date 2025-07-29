import { LlmManifest, LlmBridge } from 'llm-bridge-spec';
import { z } from 'zod';
import { BridgeLoader, BridgeLoadResult } from '../types';

/**
 * 의존성 기반 로더 구현체입니다.
 * 지정된 패키지를 동적으로 가져와 매니페스트와 브릿지 클래스를 반환합니다.
 */

export class DependencyBridgeLoader implements BridgeLoader {
  async load<M extends LlmManifest>(pkg: string): Promise<BridgeLoadResult<M>> {
    // 패키지를 동적으로 import하여 브릿지 클래스를 가져옴
    const mod = await import(pkg);

    const BridgeClass = mod.default;

    if (!BridgeClass || typeof BridgeClass.manifest !== 'function') {
      throw new Error(`Invalid LLM bridge package: ${pkg}`);
    }

    const manifest = BridgeClass.manifest() as M;
    const ctor = BridgeClass as new (config: z.infer<M['configSchema']>) => LlmBridge;
    const configSchema = manifest.configSchema;

    return { manifest, ctor, configSchema };
  }

  private async loadModule(pkg: string) {
    try {
      const mod = await import(pkg);

      return mod.default;
    } catch (error) {
      throw new Error(`Failed to load LLM bridge package: ${pkg}`);
    }
  }
}
