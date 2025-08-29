import { z } from 'zod';

export const OpenAIEmbeddingConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseURL: z.string().url().optional(),
  organization: z.string().optional(),
  project: z.string().optional(),
  timeout: z.number().optional(),
  maxRetries: z.number().optional(),
  model: z.string().optional(),
  dimension: z.number().optional(),
});

export type OpenAIEmbeddingConfig = z.infer<typeof OpenAIEmbeddingConfigSchema>;
