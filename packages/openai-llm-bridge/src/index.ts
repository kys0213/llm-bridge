import { SDK } from 'llm-bridge-spec';
import { OpenAIBridge } from './bridge/openai-bridge';
import { createOpenAIBridge } from './bridge/openai-factory';
import { OPENAI_MANIFEST } from './bridge/openai-manifest';

// 🎉 이제 이렇게 간단하게!
export default SDK.createBridgePackage({
  bridge: OpenAIBridge,
  factory: createOpenAIBridge,
  manifest: OPENAI_MANIFEST,
});

// 타입 exports
export type { OpenAIConfig } from './bridge/openai-config';
export type { ModelMetadata } from './bridge/openai-models';
