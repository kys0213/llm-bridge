import { LlmManifest, LlmModelInfo } from 'llm-bridge-spec';
import { BedrockConfigSchema } from './types';

const BEDROCK_MODELS: LlmModelInfo[] = [
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
  {
    name: 'meta.llama3-70b-instruct-v1:0',
    contextWindowTokens: 8192,
    pricing: { unit: 1000, currency: 'USD', prompt: 0.002, completion: 0.002 },
  },
];

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
  models: BEDROCK_MODELS,
  description:
    'Universal LLM Bridge for Amazon Bedrock - supports Anthropic Claude, Meta Llama, and more models through a single interface',
};
