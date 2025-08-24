import type { LlmManifest } from 'llm-bridge-spec';
import type { ZodObject } from 'zod';
import { z } from 'zod';

export const OpenaiLikeConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  model: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().positive().optional(),
  timeoutMs: z.number().int().positive().optional().default(60_000),
  headers: z.record(z.string(), z.string()).optional(),
  organization: z.string().optional(),
  compatibility: z
    .object({
      strict: z.boolean().optional(),
      streamDeltaMode: z.enum(['text', 'content-part']).optional(),
    })
    .optional(),
});

export type OpenaiLikeConfig = z.infer<typeof OpenaiLikeConfigSchema>;

export const OPENAI_LIKE_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'openai-like-llm-bridge',
  language: 'typescript',
  entry: 'src/bridge/openai-like-bridge.ts',
  configSchema: OpenaiLikeConfigSchema as unknown as ZodObject,
  capabilities: {
    modalities: ['text'],
    supportsToolCall: false,
    supportsFunctionCall: false,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: false,
  },
  models: [
    {
      name: 'openai-compatible',
      contextWindowTokens: 128_000,
      pricing: { unit: 1000, currency: 'USD', prompt: 0, completion: 0 },
    },
  ],
  description: 'OpenAI-compatible chat completions bridge for multiple providers (vLLM and others)',
};
