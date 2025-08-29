import { OpenAIEmbeddingConfigSchema } from './openai-embedding-config';
import { z } from 'zod';

export interface EmbeddingManifest {
  schemaVersion: string;
  name: string;
  language: string;
  entry: string;
  configSchema: z.ZodTypeAny;
  description?: string;
}

export const OPENAI_EMBEDDING_MANIFEST: EmbeddingManifest = {
  schemaVersion: '1.0.0',
  name: 'openai-embedding-bridge',
  language: 'typescript',
  entry: 'src/bridge/openai-embedding-bridge.ts',
  configSchema: OpenAIEmbeddingConfigSchema,
  description: 'OpenAI Embedding Bridge Implementation',
};
