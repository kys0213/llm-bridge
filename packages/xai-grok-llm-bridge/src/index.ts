import { SDK } from 'llm-bridge-spec';
import { GrokBridge } from './bridge/grok-bridge';
import { createGrokBridge } from './bridge/grok-factory';
import { XAI_GROK_MANIFEST } from './bridge/grok-manifest';

export default SDK.createBridgePackage({
  bridge: GrokBridge,
  factory: createGrokBridge,
  manifest: XAI_GROK_MANIFEST,
});

export type { GrokConfig } from './bridge/types';
