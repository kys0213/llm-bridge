import { pipeline } from '@xenova/transformers';
import {
  EmbeddingBridge,
  EmbeddingModelMetadata,
  EmbeddingRequest,
  EmbeddingResponse,
} from 'embedding-bridge-spec';
import type { MultiModalContent } from 'llm-bridge-spec';
import {
  EmbeddingGemmaConfig,
  EmbeddingGemmaConfigSchema,
  EmbeddingGemmaEmbeddingOptions,
  EmbeddingGemmaPipelineConfig,
} from './embeddinggemma-config';

const DEFAULT_MODEL = 'google/embedding-gemma-002';

type PipelineRunner = (input: string | string[], options?: Record<string, unknown>) => Promise<unknown>;

type FeatureExtractionPipeline = PipelineRunner & {
  config?: unknown;
  model?: { config?: unknown } | unknown;
};

interface TensorLike {
  data: ArrayLike<number>;
  dims?: number[];
  tolist?: () => unknown;
}

interface ResolvedEmbeddingOptions {
  pooling: NonNullable<EmbeddingGemmaEmbeddingOptions['pooling']>;
  normalize: boolean;
  batchSize?: number;
}

function contentToString(content: MultiModalContent): string {
  if (content.contentType !== 'text') {
    throw new Error(
      `Only text content is supported for embeddings (received "${content.contentType}").`
    );
  }
  return content.value;
}

function isTensorLike(value: unknown): value is TensorLike {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (!('data' in value)) {
    return false;
  }
  const data = (value as { data: unknown }).data;
  return Array.isArray(data) || ArrayBuffer.isView(data);
}

function toNumberArray(source: ArrayLike<number> | Iterable<number>): number[] {
  return Array.from(source);
}

type NumericArrayBufferView =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

function isNumericArrayBufferView(value: ArrayBufferView): value is NumericArrayBufferView {
  return 'length' in value && typeof (value as { length: unknown }).length === 'number' && 'BYTES_PER_ELEMENT' in value;
}

export class EmbeddingGemmaBridge implements EmbeddingBridge {
  private readonly modelId: string;
  private readonly pipelineOptions: EmbeddingGemmaPipelineConfig;
  private readonly embeddingOptions: ResolvedEmbeddingOptions;
  private pipelinePromise?: Promise<FeatureExtractionPipeline>;
  private dimension?: number;

  constructor(config?: EmbeddingGemmaConfig) {
    const parsed = EmbeddingGemmaConfigSchema.parse(config ?? {});
    this.modelId = parsed.model ?? DEFAULT_MODEL;
    this.pipelineOptions = parsed.pipeline ?? {};
    this.embeddingOptions = {
      pooling: parsed.embedding?.pooling ?? 'mean',
      normalize: parsed.embedding?.normalize ?? true,
      batchSize: parsed.embedding?.batchSize,
    };
  }

  private normalizeSingleInput(value: string | MultiModalContent): string {
    return typeof value === 'string' ? value : contentToString(value);
  }

  private normalizeInput(input: EmbeddingRequest['input']): string | string[] {
    if (Array.isArray(input)) {
      if (input.length === 0) {
        throw new Error('Embedding request must include at least one input item.');
      }
      return input.map(item => this.normalizeSingleInput(item));
    }
    return this.normalizeSingleInput(input);
  }

  private buildPipelineOptions(): Record<string, unknown> | undefined {
    const options: Record<string, unknown> = {};
    const config = this.pipelineOptions;

    if (typeof config.revision === 'string') {
      options.revision = config.revision;
    }
    if (typeof config.quantized === 'boolean') {
      options.quantized = config.quantized;
    }
    if (typeof config.cacheDir === 'string') {
      options.cache_dir = config.cacheDir;
    }
    if (typeof config.localFilesOnly === 'boolean') {
      options.local_files_only = config.localFilesOnly;
    }
    if (typeof config.progressCallback === 'function') {
      options.progress_callback = config.progressCallback;
    }
    if (config.device !== undefined) {
      options.device = config.device;
    }
    if (typeof config.dtype === 'string') {
      options.dtype = config.dtype;
    }
    if (Array.isArray(config.executionProviders) && config.executionProviders.length > 0) {
      options.execution_providers = config.executionProviders;
    }

    return Object.keys(options).length > 0 ? options : undefined;
  }

  private createEmbeddingCallOptions(): Record<string, unknown> {
    const options: Record<string, unknown> = {
      pooling: this.embeddingOptions.pooling,
      normalize: this.embeddingOptions.normalize,
    };

    if (typeof this.embeddingOptions.batchSize === 'number') {
      options.batch_size = this.embeddingOptions.batchSize;
    }

    return options;
  }

  private async getPipeline(): Promise<FeatureExtractionPipeline> {
    if (!this.pipelinePromise) {
      this.pipelinePromise = pipeline(
        'feature-extraction',
        this.modelId,
        this.buildPipelineOptions()
      ) as Promise<FeatureExtractionPipeline>;
    }
    return this.pipelinePromise;
  }

  private updateDimension(length: number | undefined) {
    if (typeof length === 'number' && Number.isFinite(length) && length > 0) {
      this.dimension = length;
    }
  }

  private tensorToEmbeddings(tensor: TensorLike, inputCount: number): number[] | number[][] {
    const dims = Array.isArray(tensor.dims) ? tensor.dims : [];

    if (dims.length > 2) {
      throw new Error(
        'Received tensor output with more than two dimensions. Configure embedding.pooling (e.g. "mean") to obtain fixed-size embeddings.'
      );
    }

    const data = toNumberArray(tensor.data);

    if (inputCount <= 1 || (dims.length > 0 && dims[0] === 1)) {
      const vectorLength =
        dims.length > 1 ? dims.slice(1).reduce((acc, value) => acc * value, 1) : data.length;
      const vector = data.slice(0, vectorLength);
      this.updateDimension(vector.length);
      return vector;
    }

    const batchSize = dims[0] ?? inputCount;
    const vectorLength =
      dims.length > 1
        ? dims.slice(1).reduce((acc, value) => acc * value, 1)
        : Math.floor(data.length / batchSize);

    if (!Number.isFinite(vectorLength) || vectorLength <= 0) {
      throw new Error('Unable to determine embedding dimension from pipeline output.');
    }

    if (data.length !== vectorLength * batchSize) {
      throw new Error('Unexpected pipeline output length for the provided input batch.');
    }

    const embeddings: number[][] = [];
    for (let i = 0; i < batchSize; i += 1) {
      const start = i * vectorLength;
      const end = start + vectorLength;
      embeddings.push(data.slice(start, end));
    }

    this.updateDimension(vectorLength);
    return embeddings;
  }

  private ensureNumberArray(value: unknown): number[] {
    if (Array.isArray(value)) {
      return value.map(item => {
        if (typeof item !== 'number' || Number.isNaN(item)) {
          throw new Error('Expected numeric embedding values from pipeline output.');
        }
        return item;
      });
    }
    if (ArrayBuffer.isView(value) && isNumericArrayBufferView(value)) {
      return toNumberArray(value);
    }
    throw new Error('Unsupported embedding value type from pipeline output.');
  }

  private parseEmbeddings(result: unknown, inputCount: number): number[] | number[][] {
    if (isTensorLike(result)) {
      return this.tensorToEmbeddings(result, inputCount);
    }

    if (Array.isArray(result)) {
      if (result.length === 0) {
        return inputCount > 1 ? [] : [];
      }

      if (typeof result[0] === 'number') {
        const vector = this.ensureNumberArray(result);
        if (inputCount > 1) {
          throw new Error(
            'Expected batched embeddings but received a single vector from the pipeline.'
          );
        }
        this.updateDimension(vector.length);
        return vector;
      }

      if (isTensorLike(result[0])) {
        const tensors = result as TensorLike[];
        const embeddings = tensors.map(tensor => this.tensorToEmbeddings(tensor, 1) as number[]);
        if (inputCount <= 1 && embeddings.length === 1) {
          const vector = embeddings[0];
          this.updateDimension(vector.length);
          return vector;
        }
        this.updateDimension(embeddings[0]?.length ?? this.dimension ?? 0);
        return embeddings;
      }

      if (Array.isArray(result[0]) || ArrayBuffer.isView(result[0])) {
        const embeddings = (result as unknown[]).map(item => this.ensureNumberArray(item));
        if (inputCount <= 1 && embeddings.length === 1) {
          const vector = embeddings[0];
          this.updateDimension(vector.length);
          return vector;
        }
        this.updateDimension(embeddings[0]?.length ?? this.dimension ?? 0);
        return embeddings;
      }
    }

    throw new Error('Unsupported pipeline output format for EmbeddingGemma embeddings.');
  }

  private extractDimension(source: unknown, visited = new Set<unknown>()): number | undefined {
    if (!source || typeof source !== 'object' || visited.has(source)) {
      return undefined;
    }

    visited.add(source);

    const record = source as Record<string, unknown>;
    const candidateKeys = [
      'hidden_size',
      'embedding_dim',
      'projection_dim',
      'output_dim',
      'dim',
      'd_model',
    ];

    for (const key of candidateKeys) {
      const value = record[key];
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
      }
    }

    for (const value of Object.values(record)) {
      if (typeof value === 'object' && value !== null) {
        const nested = this.extractDimension(value, visited);
        if (typeof nested === 'number') {
          return nested;
        }
      }
    }

    return undefined;
  }

  private ensureDimensionFromModel(pipe: FeatureExtractionPipeline): void {
    if (this.dimension) {
      return;
    }

    const possibleSources: unknown[] = [
      (pipe as { config?: unknown }).config,
      (pipe as { model?: unknown }).model,
      (pipe as { model?: { config?: unknown } }).model?.config,
    ];

    for (const source of possibleSources) {
      const value = this.extractDimension(source);
      if (typeof value === 'number') {
        this.dimension = value;
        return;
      }
    }
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const normalizedInput = this.normalizeInput(request.input);
    const pipe = await this.getPipeline();
    const result = await pipe(normalizedInput, this.createEmbeddingCallOptions());
    const embeddings = this.parseEmbeddings(
      result,
      Array.isArray(request.input) ? request.input.length : 1
    );
    return { embeddings };
  }

  async getMetadata(): Promise<EmbeddingModelMetadata> {
    const pipe = await this.getPipeline();
    this.ensureDimensionFromModel(pipe);
    return { model: this.modelId, dimension: this.dimension ?? 0 };
  }
}
