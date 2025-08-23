// 메인 브릿지 클래스
export { OllamaBridge } from './bridge/ollama-bridge';

// 매니페스트
export { OLLAMA_BRIDGE_MANIFEST } from './bridge/ollama-manifest';

// 팩토리 함수들
export {
  createOllamaBridge,
  createDefaultOllamaBridge,
  createLlamaBridge,
  createGemmaBridge,
  createGptOssBridge,
} from './factory/ollama-factory';

// 타입들
export { OllamaBaseConfig, OllamaBaseConfigSchema } from './types/config';

// 모델들
export {
  AbstractOllamaModel,
  LlamaModel,
  GemmaModel,
  GptOssModel,
  LlamaConfig,
  GemmaConfig,
  GptOssConfig,
  ALL_SUPPORTED_MODELS,
  createModelFromId,
} from './models';

// 에러 핸들러
export { handleOllamaError, handleFactoryError, validateModel } from './utils/error-handler';
import { SDK } from 'llm-bridge-spec';
import { OllamaBridge } from './bridge/ollama-bridge';
import { createOllamaBridge } from './factory/ollama-factory';
import { OLLAMA_BRIDGE_MANIFEST } from './bridge/ollama-manifest';

// default export for loader compatibility
export default SDK.createBridgePackage({
  bridge: OllamaBridge,
  factory: createOllamaBridge,
  manifest: OLLAMA_BRIDGE_MANIFEST,
});
