import { LlmManifest } from '@agentos/llm-bridge-spec';
import { OllamaLlama3Bridge } from './bridge/ollama-llama3-bridge';
import { OLLAMA_LLAMA3_MANIFEST } from './bridge/ollama-llama3-manifest';

export default OllamaLlama3Bridge;

export function manifest(): LlmManifest {
  return OLLAMA_LLAMA3_MANIFEST;
}
