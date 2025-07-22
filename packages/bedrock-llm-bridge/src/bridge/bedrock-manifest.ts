import { LlmManifest } from 'llm-bridge-spec';
import { BedrockConfigSchema } from './types';

export const BEDROCK_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'bedrock-llm-bridge',
  language: 'typescript',
  entry: 'src/bridge/bedrock-bridge.ts',
  configSchema: BedrockConfigSchema,
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true, // Depends on model (Claude: true, Llama: false)
    supportsFunctionCall: true, // Depends on model (Claude: true, Llama: false)
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: true, // Depends on model (Claude 3: true, Llama: false)
  },
  description:
    'Universal LLM Bridge for Amazon Bedrock - supports Anthropic Claude, Meta Llama, and more models through a single interface',
};
