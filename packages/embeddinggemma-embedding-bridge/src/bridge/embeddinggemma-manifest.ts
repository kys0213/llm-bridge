import { EmbeddingGemmaConfigSchema } from './embeddinggemma-config';
import { z } from 'zod';

export interface EmbeddingManifest {
  schemaVersion: string;
  name: string;
  language: string;
  entry: string;
  configSchema: z.ZodTypeAny;
  description?: string;
}

export const EMBEDDINGGEMMA_MANIFEST: EmbeddingManifest = {
  schemaVersion: '1.0.0',
  name: 'embeddinggemma-embedding-bridge',
  language: 'typescript',
  entry: 'src/bridge/embeddinggemma-bridge.ts',
  configSchema: EmbeddingGemmaConfigSchema,
  description: 'Google EmbeddingGemma model bridge',
};
