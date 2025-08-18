import { LlmManifest, LlmBridge } from 'llm-bridge-spec';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { BridgeLoader, BridgeLoadResult, ScanOptions } from '../types';

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

    const result: BridgeLoadResult<M> = { manifest, ctor, configSchema };
    this.validate(result);
    return result;
  }

  async scan<M extends LlmManifest>(options: ScanOptions = {}): Promise<BridgeLoadResult<M>[]> {
    const { cwd = process.cwd(), includeDev = true } = options;
    const pkgPath = path.join(cwd, 'package.json');
    const pkgData = JSON.parse(await fs.readFile(pkgPath, 'utf8'));

    const deps = Object.keys(pkgData.dependencies ?? {});
    const devDeps = includeDev ? Object.keys(pkgData.devDependencies ?? {}) : [];
    const candidates = [...deps, ...devDeps].filter((name) => name.endsWith('-llm-bridge'));

    const results: BridgeLoadResult<M>[] = [];
    for (const name of candidates) {
      try {
        const loaded = await this.load<M>(name);
        results.push(loaded);
      } catch (err) {
        throw new Error(`[llm-bridge-loader] ${name} 로딩 실패`, { cause: err });
      }
    }

    return results;
  }

  private validate<M extends LlmManifest>(result: BridgeLoadResult<M>): void {
    if (!result.manifest?.name || typeof result.ctor !== 'function') {
      throw new Error(`Invalid LLM bridge manifest: ${result.manifest?.name ?? 'unknown'}`);
    }
  }
}
