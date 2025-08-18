import { LlmManifest, LlmBridge } from 'llm-bridge-spec';
import { z } from 'zod';

export interface BridgeLoadResult<M extends LlmManifest> {
  manifest: M;
  ctor: new (config: z.infer<M['configSchema']>) => LlmBridge;
  configSchema: M['configSchema'];
}

export interface ScanOptions {
  cwd?: string;
  includeDev?: boolean;
}

export interface BridgeLoader {
  load<M extends LlmManifest>(pkg: string): Promise<BridgeLoadResult<M>>;
  scan<M extends LlmManifest>(options?: ScanOptions): Promise<BridgeLoadResult<M>[]>;
}
