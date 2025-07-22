import { LlmManifest } from 'llm-bridge-spec';
import { OllamaLlama3ConfigSchema } from './ollama-llama3-bridge';

export const OLLAMA_LLAMA3_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'ollama-llama3-bridge',
  language: 'typescript',
  entry: 'src/bridge/ollama-llama3-bridge.ts',
  configSchema: OllamaLlama3ConfigSchema,
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  description: 'Ollama Llama3 LLM Bridge - supports local Llama models through Ollama',
};
