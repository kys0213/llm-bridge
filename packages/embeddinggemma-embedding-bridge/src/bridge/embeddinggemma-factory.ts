import { EmbeddingGemmaBridge } from './embeddinggemma-bridge';
import { EmbeddingGemmaConfig, EmbeddingGemmaConfigSchema } from './embeddinggemma-config';

export function createEmbeddingGemmaBridge(config?: EmbeddingGemmaConfig): EmbeddingGemmaBridge {
  EmbeddingGemmaConfigSchema.parse(config ?? {});
  return new EmbeddingGemmaBridge(config);
}
