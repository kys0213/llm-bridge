import { LlmManifest, LlmModelInfo } from 'llm-bridge-spec';
import { OllamaBaseConfigSchema } from '../types/config';

const OLLAMA_MODELS: LlmModelInfo[] = [
  {
    name: 'llama3.2',
    contextWindowTokens: 4096,
    pricing: { unit: 1000, currency: 'USD', prompt: 0, completion: 0 },
  },
  {
    name: 'gemma2',
    contextWindowTokens: 8192,
    pricing: { unit: 1000, currency: 'USD', prompt: 0, completion: 0 },
  },
];

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
  models: OLLAMA_MODELS,
};
