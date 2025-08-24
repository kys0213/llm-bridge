import { OpenaiLikeBridge } from './openai-like-bridge';
import type { OpenaiLikeConfig } from './types';

export function createOpenaiLikeBridge(config: OpenaiLikeConfig): OpenaiLikeBridge {
  return new OpenaiLikeBridge(config);
}
