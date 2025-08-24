import { LlmManifest } from 'llm-bridge-spec';
import { AnthropicBridge } from './bridge/anthropic-bridge';
import { ANTHROPIC_MANIFEST } from './bridge/anthropic-manifest';

export default AnthropicBridge;

export function manifest(): LlmManifest {
  return ANTHROPIC_MANIFEST;
}

export * from './bridge/anthropic-bridge';
export * from './bridge/anthropic-config';
export * from './bridge/anthropic-factory';
export * from './bridge/anthropic-manifest';
export * from './bridge/anthropic-models';
