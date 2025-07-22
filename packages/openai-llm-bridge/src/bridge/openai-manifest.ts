import { LlmManifest } from 'llm-bridge-spec';
import { OpenAIConfigSchema } from './openai-config';

export const OPENAI_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'openai-bridge',
  language: 'typescript',
  entry: 'src/bridge/openai-bridge.ts',
  configSchema: OpenAIConfigSchema,
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  description:
    'Universal OpenAI Bridge - supports all OpenAI models including GPT-3.5, GPT-4, GPT-4o, and o1 series',
};
