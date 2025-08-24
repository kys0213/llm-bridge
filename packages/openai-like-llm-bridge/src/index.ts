import { SDK } from 'llm-bridge-spec';
import { OpenaiLikeBridge } from './bridge/openai-like-bridge';
import { createOpenaiLikeBridge } from './bridge/openai-like-factory';
import { OPENAI_LIKE_MANIFEST } from './bridge/openai-like-manifest';

export default SDK.createBridgePackage({
  bridge: OpenaiLikeBridge,
  factory: createOpenaiLikeBridge,
  manifest: OPENAI_LIKE_MANIFEST,
});

export type { OpenaiLikeConfig } from './bridge/types';
