import { LlmManifest } from 'llm-bridge-spec';
import { AnthropicConfigSchema } from './anthropic-config';
import { ANTHROPIC_MODELS } from './anthropic-models';

export const ANTHROPIC_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'anthropic-bridge',
  language: 'typescript',
  entry: 'src/bridge/anthropic-bridge.ts',
  configSchema: AnthropicConfigSchema,
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: false,
  },
  models: ANTHROPIC_MODELS,
  description:
    'Universal Anthropic Claude Bridge - supports all Claude models including Opus 4.1, Sonnet 4, Sonnet 3.7, and Haiku 3.5',
};
