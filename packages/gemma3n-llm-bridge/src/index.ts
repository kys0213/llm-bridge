import { SDK } from 'llm-bridge-spec';
import { OllamaGemma3nBridge, createOllamaGemma3nBridge } from './bridge/ollama-gemma3n-bridge';
import { OLLAMA_GEMMA3N_MANIFEST } from './bridge/ollama-gemma3n-manifest';

// 🎉 이제 이렇게 간단하게!
export default SDK.createBridgePackage({
  bridge: OllamaGemma3nBridge,
  factory: createOllamaGemma3nBridge,
  manifest: OLLAMA_GEMMA3N_MANIFEST,
});

export { OLLAMA_GEMMA3N_MANIFEST } from './bridge/ollama-gemma3n-manifest';

// 타입 exports
export type { OllamaGemma3nConfig } from './bridge/ollama-gemma3n-bridge';
