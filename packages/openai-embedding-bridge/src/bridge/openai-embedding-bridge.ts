import OpenAI from 'openai';
import {
  EmbeddingBridge,
  EmbeddingModelMetadata,
  EmbeddingRequest,
  EmbeddingResponse,
} from 'embedding-bridge-spec';
import type { MultiModalContent } from 'llm-bridge-spec';
import { OpenAIEmbeddingConfig } from './openai-embedding-config';

function contentToString(content: MultiModalContent): string {
  if (content.contentType !== 'text') {
    throw new Error('Only text content is supported for embeddings');
  }
  return content.value;
}

export class OpenAIEmbeddingBridge implements EmbeddingBridge {
  private model: string;
  private dimension: number;

  constructor(
    private client: OpenAI,
    private config: OpenAIEmbeddingConfig
  ) {
    this.model = config.model ?? 'text-embedding-3-small';
    this.dimension = config.dimension ?? (this.model === 'text-embedding-3-large' ? 3072 : 1536);
  }

  private normalizeInput(input: EmbeddingRequest['input']): string | string[] {
    if (Array.isArray(input)) {
      return input.map(item => (typeof item === 'string' ? item : contentToString(item)));
    }
    return typeof input === 'string' ? input : contentToString(input);
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const input = this.normalizeInput(request.input);
    const res = await this.client.embeddings.create({
      model: this.model,
      input,
      dimensions: this.dimension,
    });
    const vectors = res.data.map(d => d.embedding);
    const embeddings = Array.isArray(request.input) ? vectors : vectors[0];
    return {
      embeddings,
      usage: res.usage ? { promptTokens: res.usage.prompt_tokens ?? 0 } : undefined,
    };
  }

  async getMetadata(): Promise<EmbeddingModelMetadata> {
    return { model: this.model, dimension: this.dimension };
  }
}
