import { LlmManifest } from 'llm-bridge-spec';
import { BedrockAnthropicConfigSchema } from './types';

export const BEDROCK_ANTHROPIC_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'bedrock-anthropic-llm-bridge',
  language: 'typescript',
  entry: 'src/bridge/bedrock-anthropic-bridge.ts',
  configSchema: BedrockAnthropicConfigSchema,
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: false,
    supportsVision: false,
  },
  description: 'The bridge for Anthropic models on Amazon Bedrock',
};
