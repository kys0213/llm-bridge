import { SDK } from 'llm-bridge-spec';
import { OllamaLlama3Bridge, createOllamaLlama3Bridge } from './bridge/ollama-llama3-bridge';
import { OLLAMA_LLAMA3_MANIFEST } from './bridge/ollama-llama3-manifest';

// 🎉 이제 이렇게 간단하게!
export default SDK.createBridgePackage({
  bridge: OllamaLlama3Bridge,
  factory: createOllamaLlama3Bridge,
  manifest: OLLAMA_LLAMA3_MANIFEST,
});

// 타입 exports
export type { OllamaLlama3Config } from './bridge/ollama-llama3-bridge';
