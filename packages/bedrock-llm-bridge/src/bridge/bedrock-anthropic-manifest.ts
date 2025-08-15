import { LlmManifest, LlmModelInfo } from 'llm-bridge-spec';
import { BedrockAnthropicConfigSchema } from './types';

const BEDROCK_ANTHROPIC_MODELS: LlmModelInfo[] = [
  {
    name: 'anthropic.claude-3-sonnet-20240229-v1:0',
    contextWindowTokens: 200000,
    pricing: { unit: 1000, currency: 'USD', prompt: 0.008, completion: 0.024 },
  },
  {
    name: 'anthropic.claude-3-haiku-20240307-v1:0',
    contextWindowTokens: 200000,
    pricing: { unit: 1000, currency: 'USD', prompt: 0.002, completion: 0.006 },
  },
];

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
  models: BEDROCK_ANTHROPIC_MODELS,
  description: 'The bridge for Anthropic models on Amazon Bedrock',
};
