import { EmbeddingGemmaBridge } from './bridge/embeddinggemma-bridge';
import { createEmbeddingGemmaBridge } from './bridge/embeddinggemma-factory';
import { EMBEDDINGGEMMA_MANIFEST } from './bridge/embeddinggemma-manifest';

export default class EmbeddingGemmaBridgePackage extends EmbeddingGemmaBridge {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(...args: ConstructorParameters<typeof EmbeddingGemmaBridge>) {
    super(...args);
  }

  static create = createEmbeddingGemmaBridge;
  static manifest = () => EMBEDDINGGEMMA_MANIFEST;
}

export { EmbeddingGemmaBridge, createEmbeddingGemmaBridge, EMBEDDINGGEMMA_MANIFEST };
export type {
  EmbeddingGemmaConfig,
  EmbeddingGemmaEmbeddingOptions,
  EmbeddingGemmaPipelineConfig,
} from './bridge/embeddinggemma-config';
