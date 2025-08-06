// 타입 및 상수 import
import { SUPPORTED_LLAMA_MODELS } from './llama/types';
import { SUPPORTED_GEMMA_MODELS } from './gemma/types';
import { SUPPORTED_GPT_OSS_MODELS } from './gpt-oss/types';
import { AbstractOllamaModel } from './base/abstract-ollama-model';
import { LlamaModel } from './llama/llama-model';
import { GemmaModel } from './gemma/gemma-model';
import { GptOssModel } from './gpt-oss/gpt-oss-model';

// 추상 모델 클래스
export { AbstractOllamaModel } from './base/abstract-ollama-model';

// Llama 모델
export { LlamaModel } from './llama/llama-model';
export {
  LlamaConfig,
  LlamaConfigSchema,
  SUPPORTED_LLAMA_MODELS,
  LlamaModelInfo,
} from './llama/types';

// Gemma 모델
export { GemmaModel } from './gemma/gemma-model';
export {
  GemmaConfig,
  GemmaConfigSchema,
  SUPPORTED_GEMMA_MODELS,
  GemmaModelInfo,
} from './gemma/types';

// GPT-OSS 모델
export { GptOssModel } from './gpt-oss/gpt-oss-model';
export {
  GptOssConfig,
  GptOssConfigSchema,
  SUPPORTED_GPT_OSS_MODELS,
  GptOssModelInfo,
} from './gpt-oss/types';

// 모든 지원 모델 목록
export const ALL_SUPPORTED_MODELS = [
  ...SUPPORTED_LLAMA_MODELS,
  ...SUPPORTED_GEMMA_MODELS,
  ...SUPPORTED_GPT_OSS_MODELS,
] as const;

// 모델 팩토리 함수
export function createModelFromId(modelId: string): AbstractOllamaModel {
  const llamaModel = new LlamaModel(modelId);
  if (llamaModel.supportsModel(modelId)) {
    return llamaModel;
  }

  const gemmaModel = new GemmaModel(modelId);
  if (gemmaModel.supportsModel(modelId)) {
    return gemmaModel;
  }

  const gptOssModel = new GptOssModel(modelId);
  if (gptOssModel.supportsModel(modelId)) {
    return gptOssModel;
  }

  throw new Error(
    `Unsupported model: ${modelId}. Supported models: ${ALL_SUPPORTED_MODELS.join(', ')}`
  );
}
