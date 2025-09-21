import { z } from 'zod';

const ProgressCallbackSchema = z.custom<(...args: unknown[]) => void>();

const PipelineConfigSchema = z
  .object({
    revision: z.string().optional(),
    quantized: z.boolean().optional(),
    cacheDir: z.string().optional(),
    localFilesOnly: z.boolean().optional(),
    progressCallback: ProgressCallbackSchema.optional(),
    device: z.union([z.string(), z.number()]).optional(),
    dtype: z.string().optional(),
    executionProviders: z.array(z.string()).optional(),
  })
  .partial();

const EmbeddingOptionsSchema = z
  .object({
    pooling: z.enum(['mean', 'max', 'cls']).optional(),
    normalize: z.boolean().optional(),
    batchSize: z.number().int().positive().optional(),
  })
  .partial();

export const EmbeddingGemmaConfigSchema = z
  .object({
    model: z.string().optional(),
    pipeline: PipelineConfigSchema.optional(),
    embedding: EmbeddingOptionsSchema.optional(),
  })
  .default({});

export type EmbeddingGemmaConfig = z.infer<typeof EmbeddingGemmaConfigSchema>;
export type EmbeddingGemmaPipelineConfig = z.infer<typeof PipelineConfigSchema>;
export type EmbeddingGemmaEmbeddingOptions = z.infer<typeof EmbeddingOptionsSchema>;
