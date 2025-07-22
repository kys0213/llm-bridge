import { SDK } from 'llm-bridge-spec';
import { BedrockBridge } from './bridge/bedrock-bridge';
import { createBedrockBridge } from './factory/bedrock-factory';
import { BEDROCK_MANIFEST } from './bridge/bedrock-manifest';

export default SDK.createBridgePackage({
  bridge: BedrockBridge,
  factory: createBedrockBridge,
  manifest: BEDROCK_MANIFEST,
});

export { BedrockModelBridge } from './models/base/bedrock-model-bridge';
export { AnthropicModelBridge } from './models/anthropic/anthropic-model-bridge';
export { MetaModelBridge } from './models/meta/meta-model-bridge';
export { BedrockModels } from './factory/bedrock-factory';

// 타입 exports
export type { BedrockConfig } from './bridge/types';
