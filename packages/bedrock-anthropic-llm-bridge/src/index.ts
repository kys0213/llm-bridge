import { LlmManifest } from 'llm-bridge-spec';
import { BedrockAnthropicBridge } from './bridge/bedrock-anthropic-bridge';
import { BEDROCK_ANTHROPIC_MANIFEST } from './bridge/bedrock-anthropic-manifest';

export default BedrockAnthropicBridge;

export function manifest(): LlmManifest {
  return BEDROCK_ANTHROPIC_MANIFEST;
}
