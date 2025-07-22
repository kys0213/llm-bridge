import { LlmManifest } from 'llm-bridge-spec';
import { OllamaGemma3nConfigSchema } from './ollama-gemma3n-bridge';

export const OLLAMA_GEMMA3N_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'ollama-gemma3n-bridge',
  language: 'typescript',
  entry: 'src/bridge/ollama-gemma3n-bridge.ts',
  configSchema: OllamaGemma3nConfigSchema,
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  description: 'Ollama Gemma3n LLM Bridge - supports local Gemma3n models through Ollama',
};
