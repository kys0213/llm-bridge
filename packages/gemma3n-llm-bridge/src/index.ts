import { LlmManifest } from 'llm-bridge-spec';
import { OllamaGemma3nBridge } from './bridge/ollama-gemma3n-bridge';
import { OLLAMA_GEMMA3N_MANIFEST } from './bridge/ollama-gemma3n-manifest';

export default OllamaGemma3nBridge;

export function manifest(): LlmManifest {
  return OLLAMA_GEMMA3N_MANIFEST;
}
