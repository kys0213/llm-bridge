import { LlmManifest } from 'llm-bridge-spec';

export const OPENAI_GPT4_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'openai-gpt4-bridge',
  language: 'typescript',
  entry: 'src/bridge/openai-gpt4-bridge.ts',
  configSchema: {
    type: 'object',
    required: ['apiKey'],
    properties: {
      apiKey: {
        type: 'string',
      },
      baseUrl: {
        type: 'string',
        default: 'https://api.openai.com/v1',
      },
      model: {
        type: 'string',
        default: 'gpt-4o',
      },
      temperature: {
        type: 'number',
        default: 0.7,
      },
      topP: {
        type: 'number',
        default: 0.9,
      },
      maxTokens: {
        type: 'number',
        default: 1000,
      },
      stopSequences: {
        type: 'array',
        default: [],
      },
    },
  },
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  description: 'The bridge for the OpenAI GPT-4 model',
};
