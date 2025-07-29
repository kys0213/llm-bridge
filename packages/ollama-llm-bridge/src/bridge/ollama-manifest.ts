import { LlmManifest } from 'llm-bridge-spec';
import { OllamaBaseConfigSchema } from '../types/config';

export const OLLAMA_BRIDGE_MANIFEST: LlmManifest = {
  name: 'ollama-llm-bridge',
  description: 'Universal Ollama LLM Bridge supporting multiple models (Llama, Gemma, etc.)',
  schemaVersion: '1.0.0',
  language: 'TypeScript',
  entry: 'src/index.ts',
  configSchema: OllamaBaseConfigSchema,
  capabilities: {
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: true,
    modalities: ['text', 'image', 'audio', 'video', 'file'],
  },
};
