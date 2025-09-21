import { GrokBridge } from './grok-bridge';
import type { GrokConfig } from './types';

export function createGrokBridge(config: GrokConfig): GrokBridge {
  return new GrokBridge(config);
}
