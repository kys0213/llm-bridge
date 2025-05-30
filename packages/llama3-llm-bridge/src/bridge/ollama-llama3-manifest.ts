import { LlmManifest } from 'llm-bridge-spec';

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
      model: {
        type: 'string',
        default: 'llama3.2',
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
