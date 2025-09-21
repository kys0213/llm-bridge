import type { MultiModalContent } from 'llm-bridge-spec';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmbeddingGemmaBridge } from '../bridge/embeddinggemma-bridge';
import { createEmbeddingGemmaBridge } from '../bridge/embeddinggemma-factory';

const { pipelineSpy } = vi.hoisted(() => ({
  pipelineSpy: vi.fn(),
}));

vi.mock('@xenova/transformers', () => ({
  pipeline: pipelineSpy,
}));

interface TensorMockOptions {
  configHiddenSize?: number | null;
  modelHiddenSize?: number;
}

const createTensor = (values: number[], dims?: number[]) => ({
  data: Float32Array.from(values),
  dims,
});

function setupPipelineMock(returnValue: unknown, options: TensorMockOptions = {}) {
  const { configHiddenSize, modelHiddenSize } = options;
  const pipelineInstance = vi.fn(async () => returnValue);
  const dims =
    returnValue &&
    typeof returnValue === 'object' &&
    'dims' in (returnValue as Record<string, unknown>)
      ? ((returnValue as { dims?: number[] }).dims ?? undefined)
      : undefined;

  const inferredDimension = Array.isArray(dims) && dims.length > 0 ? dims.at(-1) : undefined;
  const hasConfigOverride = Object.prototype.hasOwnProperty.call(options, 'configHiddenSize');
  const configValue = hasConfigOverride ? configHiddenSize : (inferredDimension ?? 2);

  const config: Record<string, unknown> = {};
  if (typeof configValue === 'number') {
    config.hidden_size = configValue;
  }

  const modelConfig: Record<string, unknown> = {};
  const resolvedModelSize =
    typeof modelHiddenSize === 'number'
      ? modelHiddenSize
      : typeof configValue === 'number'
        ? configValue
        : (inferredDimension ?? 2);
  modelConfig.hidden_size = resolvedModelSize;

  Object.assign(pipelineInstance, {
    config,
    model: { config: modelConfig },
  });

  pipelineSpy.mockResolvedValue(pipelineInstance);
  return pipelineInstance;
}

function expectVectorCloseTo(actual: number[], expected: number[]) {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((value, index) => {
    expect(actual[index]).toBeCloseTo(value, 6);
  });
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number');
}

function isNumberMatrix(value: unknown): value is number[][] {
  return Array.isArray(value) && value.every(isNumberArray);
}

function expectEmbeddingVector(actual: number[] | number[][], expected: number[]) {
  expect(isNumberArray(actual)).toBe(true);
  if (!isNumberArray(actual)) {
    throw new Error('Expected embedding vector');
  }
  expectVectorCloseTo(actual, expected);
}

function expectEmbeddingMatrix(actual: number[] | number[][], expected: number[][]) {
  expect(isNumberMatrix(actual)).toBe(true);
  if (!isNumberMatrix(actual)) {
    throw new Error('Expected embedding matrix');
  }
  expect(actual).toHaveLength(expected.length);
  actual.forEach((row, index) => {
    expectVectorCloseTo(row, expected[index]);
  });
}

describe('EmbeddingGemmaBridge', () => {
  beforeEach(() => {
    pipelineSpy.mockReset();
  });

  it('should create embedding for text input', async () => {
    const pipelineInstance = setupPipelineMock(createTensor([0.1, 0.2], [2]));
    const bridge = new EmbeddingGemmaBridge();

    const res = await bridge.embed({ input: 'hello' });

    expectEmbeddingVector(res.embeddings, [0.1, 0.2]);
    expect(pipelineSpy).toHaveBeenCalledWith(
      'feature-extraction',
      'google/embedding-gemma-002',
      undefined
    );
    expect(pipelineInstance).toHaveBeenCalledWith('hello', { pooling: 'mean', normalize: true });
  });

  it('should support array input and return batched embeddings', async () => {
    const pipelineInstance = setupPipelineMock(createTensor([0.1, 0.2, 0.3, 0.4], [2, 2]));
    const bridge = new EmbeddingGemmaBridge();

    const res = await bridge.embed({ input: ['a', 'b'] });

    expectEmbeddingMatrix(res.embeddings, [
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    expect(pipelineInstance).toHaveBeenCalledWith(['a', 'b'], { pooling: 'mean', normalize: true });
  });

  it('should convert multimodal text input to string', async () => {
    const pipelineInstance = setupPipelineMock(createTensor([0.2, -0.1], [2]));
    const bridge = new EmbeddingGemmaBridge();

    await bridge.embed({ input: { contentType: 'text', value: 'multi' } });

    expect(pipelineInstance).toHaveBeenCalledWith('multi', { pooling: 'mean', normalize: true });
  });

  it('should reject non-text multimodal content', async () => {
    const bridge = new EmbeddingGemmaBridge();

    const imageContent: MultiModalContent = { contentType: 'image', value: Buffer.from('') };

    await expect(bridge.embed({ input: imageContent })).rejects.toThrow(
      'Only text content is supported for embeddings'
    );
    expect(pipelineSpy).not.toHaveBeenCalled();
  });

  it('should reject empty input arrays', async () => {
    const bridge = new EmbeddingGemmaBridge();

    await expect(bridge.embed({ input: [] })).rejects.toThrow(
      'Embedding request must include at least one input item.'
    );
    expect(pipelineSpy).not.toHaveBeenCalled();
  });

  it('should apply pipeline and embedding configuration overrides', async () => {
    const pipelineInstance = setupPipelineMock(createTensor([0.1, 0.2, 0.3, 0.4], [2, 2]));
    const bridge = new EmbeddingGemmaBridge({
      pipeline: {
        cacheDir: '/tmp/cache',
        localFilesOnly: true,
        quantized: true,
        revision: 'main',
        device: 'gpu',
        dtype: 'fp16',
        executionProviders: ['cpu'],
      },
      embedding: {
        pooling: 'cls',
        normalize: false,
        batchSize: 8,
      },
    });

    const res = await bridge.embed({ input: ['a', 'b'] });

    expectEmbeddingMatrix(res.embeddings, [
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    expect(pipelineSpy).toHaveBeenCalledWith(
      'feature-extraction',
      'google/embedding-gemma-002',
      expect.objectContaining({
        cache_dir: '/tmp/cache',
        local_files_only: true,
        quantized: true,
        revision: 'main',
        device: 'gpu',
        dtype: 'fp16',
        execution_providers: ['cpu'],
      })
    );
    expect(pipelineInstance).toHaveBeenCalledWith(['a', 'b'], {
      pooling: 'cls',
      normalize: false,
      batch_size: 8,
    });
  });

  it('should derive metadata dimension from model config before embedding', async () => {
    const pipelineInstance = setupPipelineMock(createTensor([0.1, 0.2], [2]), {
      configHiddenSize: null,
      modelHiddenSize: 768,
    });
    const bridge = new EmbeddingGemmaBridge();

    const metadata = await bridge.getMetadata();

    expect(metadata).toEqual({ model: 'google/embedding-gemma-002', dimension: 768 });
    expect(pipelineInstance).not.toHaveBeenCalled();
  });

  it('factory should accept empty configuration', async () => {
    const pipelineInstance = setupPipelineMock(createTensor([0.3, 0.7], [2]));
    const bridge = createEmbeddingGemmaBridge();

    const res = await bridge.embed({ input: 'factory' });

    expectEmbeddingVector(res.embeddings, [0.3, 0.7]);
    expect(pipelineInstance).toHaveBeenCalledWith('factory', { pooling: 'mean', normalize: true });
  });

  it('should surface errors for malformed batched pipeline output', async () => {
    setupPipelineMock([0.1, 0.2]);
    const bridge = new EmbeddingGemmaBridge();

    await expect(bridge.embed({ input: ['a', 'b'] })).rejects.toThrow(
      'Expected batched embeddings but received a single vector from the pipeline.'
    );
  });

  it('should surface errors when tensor output length mismatches batch size', async () => {
    setupPipelineMock(createTensor([0.1, 0.2, 0.3], [2, 2]));
    const bridge = new EmbeddingGemmaBridge();

    await expect(bridge.embed({ input: ['x', 'y'] })).rejects.toThrow(
      'Unexpected pipeline output length for the provided input batch.'
    );
  });
});
