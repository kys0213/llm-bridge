import type { LlmManifest } from 'llm-bridge-spec';
import { z } from 'zod';

const WebSourceSchema = z
  .object({
  type: z.literal('web'),
  country: z.string().length(2).optional(),
  excludedWebsites: z.array(z.string()).max(5).optional(),
  allowedWebsites: z.array(z.string()).max(5).optional(),
  safeSearch: z.boolean().optional(),
  })
  .passthrough();

const XSourceSchema = z
  .object({
  type: z.literal('x'),
  excludedXHandles: z.array(z.string()).optional(),
  includedXHandles: z.array(z.string()).optional(),
  postFavoriteCount: z.number().int().nonnegative().optional(),
  postViewCount: z.number().int().nonnegative().optional(),
  })
  .passthrough();

const NewsSourceSchema = z
  .object({
  type: z.literal('news'),
  country: z.string().length(2).optional(),
  excludedWebsites: z.array(z.string()).max(5).optional(),
  safeSearch: z.boolean().optional(),
  })
  .passthrough();

const RssSourceSchema = z
  .object({
  type: z.literal('rss'),
  links: z.array(z.string().url()).min(1).max(1),
  })
  .passthrough();

const SearchSourceSchema = z.discriminatedUnion('type', [
  WebSourceSchema,
  XSourceSchema,
  NewsSourceSchema,
  RssSourceSchema,
]);

const SearchSchemaCore = z.object({
  mode: z.enum(['off', 'auto', 'on']).optional(),
  returnCitations: z.boolean().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  maxSearchResults: z.number().int().min(1).max(50).optional(),
  sources: z.array(SearchSourceSchema).optional(),
});

const SearchSchema = SearchSchemaCore.optional();

const ResponseFormatSchema = z.union([
  z.object({ type: z.literal('text') }),
  z.object({ type: z.literal('json_object') }),
  z.object({
    type: z.literal('json_schema'),
    name: z.string().min(1).optional(),
    schema: z.record(z.string(), z.unknown()),
    strict: z.boolean().optional(),
  }),
]);

const ToolChoiceSchema = z.union([
  z.literal('auto'),
  z.literal('none'),
  z.literal('required'),
  z.object({
    type: z.literal('function'),
    toolName: z.string(),
  }),
]);

export const GrokConfigSchema = z.object({
  baseUrl: z.string().url().default('https://api.x.ai/v1'),
  apiKey: z.string(),
  model: z.string(),
  timeoutMs: z.number().int().positive().default(60_000),
  headers: z.record(z.string(), z.string()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stopSequences: z.array(z.string()).max(4).optional(),
  reasoningEffort: z.enum(['low', 'high']).optional(),
  search: SearchSchema,
  toolChoice: ToolChoiceSchema.optional(),
  parallelToolCalls: z.boolean().optional(),
  storeMessages: z.boolean().optional(),
  responseFormat: ResponseFormatSchema.optional(),
  conversationId: z.string().optional(),
  previousResponseId: z.string().optional(),
  user: z.string().optional(),
  proxy: z
    .object({
      url: z.string().url(),
    })
    .optional(),
  seed: z.number().int().nonnegative().optional(),
});

export type GrokConfig = z.infer<typeof GrokConfigSchema>;
export type GrokSearchConfig = z.infer<typeof SearchSchemaCore>;
export type GrokSearchSource = z.infer<typeof SearchSourceSchema>;

export const XAI_GROK_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'xai-grok-llm-bridge',
  language: 'typescript',
  entry: 'src/bridge/grok-bridge.ts',
  configSchema: GrokConfigSchema,
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: false,
  },
  models: [
    {
      name: 'grok-3-latest',
      contextWindowTokens: 131_072,
      pricing: { unit: 1000, currency: 'USD', prompt: 0.0, completion: 0.0 },
    },
    {
      name: 'grok-3-mini',
      contextWindowTokens: 65_536,
      pricing: { unit: 1000, currency: 'USD', prompt: 0.0, completion: 0.0 },
    },
    {
      name: 'grok-2-latest',
      contextWindowTokens: 131_072,
      pricing: { unit: 1000, currency: 'USD', prompt: 0.0, completion: 0.0 },
    },
  ],
  description: 'xAI Grok chat completions bridge implementation',
};
