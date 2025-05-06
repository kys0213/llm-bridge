import { LlmBridge } from 'llm-bridge-spec';

export type LlmBridgeConstructor<P extends any[]> = new (...args: P) => LlmBridge;
