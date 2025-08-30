import OpenAI from 'openai';
import { OpenAIEmbeddingBridge } from './openai-embedding-bridge';
import { OpenAIEmbeddingConfig, OpenAIEmbeddingConfigSchema } from './openai-embedding-config';

export function createOpenAIEmbeddingBridge(config: OpenAIEmbeddingConfig): OpenAIEmbeddingBridge {
  const parsed = OpenAIEmbeddingConfigSchema.parse(config);
  const client = new OpenAI({
    apiKey: parsed.apiKey,
    baseURL: parsed.baseURL,
    organization: parsed.organization,
    project: parsed.project,
    timeout: parsed.timeout,
    maxRetries: parsed.maxRetries,
  });
  return new OpenAIEmbeddingBridge(client, parsed);
}
