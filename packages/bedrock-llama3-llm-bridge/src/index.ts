import { LlmManifest } from 'llm-bridge-spec';
import { BedrockLlama3Bridge } from './bridge/bedrock-llama3-bridge';
import { BEDROCK_LLAMA3_MANIFEST } from './bridge/bedrock-llama3-manifest';

export default BedrockLlama3Bridge;

export function manifest(): LlmManifest {
  return BEDROCK_LLAMA3_MANIFEST;
}
