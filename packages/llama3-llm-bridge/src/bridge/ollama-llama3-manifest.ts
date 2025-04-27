import { LlmManifest } from '@agentos/llm-bridge-spec';

export const OLLAMA_LLAMA3_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'ollama-llama3-bridge',
  language: 'typescript',
  entry: 'src/bridge/ollama-llama3-bridge.ts',
  configSchema: {
    type: 'object',
    properties: {
      host: {
        type: 'string',
        default: 'http://localhost:11434',
      },
      temperature: {
        type: 'number',
        default: 0.7,
      },
      topP: {
        type: 'number',
        default: 0.9,
      },
      topK: {
        type: 'number',
        default: 40,
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
  description: 'The bridge for the llama3 model',
};
