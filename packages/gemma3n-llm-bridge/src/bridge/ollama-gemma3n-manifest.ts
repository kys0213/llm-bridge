import { LlmManifest } from 'llm-bridge-spec';

export const OLLAMA_GEMMA3N_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'ollama-gemma3n-bridge',
  language: 'typescript',
  entry: 'src/bridge/ollama-gemma3n-bridge.ts',
  configSchema: {
    type: 'object',
    properties: {
      host: {
        type: 'string',
        default: 'http://localhost:11434',
      },
      model: {
        type: 'string',
        default: 'gemma3n:latest',
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
  description: 'The bridge for the Gemma 3n model',
};
