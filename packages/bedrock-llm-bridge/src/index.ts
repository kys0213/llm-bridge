import { SDK } from 'llm-bridge-spec';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { BedrockBridge } from './bridge/bedrock-bridge';
import { AbstractModel } from './models/base/abstract-model';
import { createBedrockBridge } from './factory/bedrock-factory';
import { BEDROCK_MANIFEST } from './bridge/bedrock-manifest';
import { BedrockConfig } from './bridge/types';

// BedrockBridge 생성자 파라미터 타입 정의
type BedrockBridgeConstructorArgs = [
  client: BedrockRuntimeClient,
  modelBridge: AbstractModel<unknown, unknown>,
  config: BedrockConfig,
];

export default SDK.createBridgePackage<BedrockBridge, BedrockConfig, BedrockBridgeConstructorArgs>({
  bridge: BedrockBridge,
  factory: createBedrockBridge,
  manifest: BEDROCK_MANIFEST,
});

export { AbstractModel as BedrockModelBridge } from './models/base/abstract-model';
export { AnthropicModel } from './models/anthropic/anthropic-model';
export { MetaModel as MetaModelBridge } from './models/meta/meta-model';
export { BedrockModels } from './factory/bedrock-factory';

// 타입 exports
export type { BedrockConfig } from './bridge/types';
export type { BedrockBridgeConstructorArgs };

// Anthropic 상세 타입들
export type {
  AnthropicRequestBody,
  AnthropicResponseBody,
  AnthropicMessage,
  AnthropicContent,
  AnthropicTextContent,
  AnthropicImageContent,
  AnthropicCustomTool,
  AnthropicComputerTool,
  AnthropicBashTool,
  AnthropicTextEditorTool,
  AnthropicTool,
  AnthropicToolChoice,
  AnthropicResponseContent,
  AnthropicToolUseContent,
  AnthropicStopReason,
} from './models/anthropic/types';

// Meta 상세 타입들
export type { MetaRequestBody, MetaResponseBody, MetaMessage } from './models/meta/types';
