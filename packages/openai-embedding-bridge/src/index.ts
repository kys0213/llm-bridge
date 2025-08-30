import { OpenAIEmbeddingBridge } from './bridge/openai-embedding-bridge';
import { createOpenAIEmbeddingBridge } from './bridge/openai-embedding-factory';
import { OPENAI_EMBEDDING_MANIFEST } from './bridge/openai-embedding-manifest';

export default class OpenAIEmbeddingBridgePackage extends OpenAIEmbeddingBridge {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(...args: ConstructorParameters<typeof OpenAIEmbeddingBridge>) {
    super(...args);
  }

  static create = createOpenAIEmbeddingBridge;
  static manifest = () => OPENAI_EMBEDDING_MANIFEST;
}

export { OpenAIEmbeddingBridge, createOpenAIEmbeddingBridge, OPENAI_EMBEDDING_MANIFEST };
export type { OpenAIEmbeddingConfig } from './bridge/openai-embedding-config';
