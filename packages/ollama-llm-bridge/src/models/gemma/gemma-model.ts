import { ConfigurationError, LlmBridgeCapabilities, LlmMetadata } from 'llm-bridge-spec';
import { AbstractOllamaModel } from '../base/abstract-ollama-model';
import { GemmaConfig, GemmaConfigSchema, GemmaModelInfo, SUPPORTED_GEMMA_MODELS } from './types';

export class GemmaModel extends AbstractOllamaModel<GemmaConfig> {
  constructor(modelId: string = 'gemma3n:latest') {
    super(modelId);
  }

  supportsModel(modelId: string): boolean {
    // Gemma 모델 패턴 확인
    return (
      modelId.startsWith('gemma') ||
      SUPPORTED_GEMMA_MODELS.some(model => modelId.includes(model.split(':')[0]))
    );
  }

  getSupportedModels(): string[] {
    return [...SUPPORTED_GEMMA_MODELS];
  }

  getCapabilities(): LlmBridgeCapabilities {
    return {
      modalities: ['text', 'image', 'audio', 'video', 'file'],
      supportsToolCall: true,
      supportsFunctionCall: true,
      supportsMultiTurn: true,
      supportsStreaming: true,
      supportsVision: true,
    };
  }

  getMetadata(): LlmMetadata {
    const modelInfo = this.getModelInfo();
    return {
      name: modelInfo.name,
      version: modelInfo.version,
      description: `Ollama ${modelInfo.name} Bridge (${modelInfo.modelSize})`,
      model: this.modelId,
      contextWindow: modelInfo.contextWindow,
      maxTokens: modelInfo.maxTokens,
    };
  }

  getDefaultConfig(): Partial<GemmaConfig> {
    return GemmaConfigSchema.parse({
      model: this.modelId,
      temperature: 0.7,
      num_predict: 2048,
    });
  }

  validateConfig(config: GemmaConfig): void {
    try {
      GemmaConfigSchema.parse(config);
    } catch (error) {
      throw new ConfigurationError(`Invalid Gemma configuration: ${String(error)}`);
    }
  }

  /**
   * Get model-specific information based on model ID
   */
  private getModelInfo(): GemmaModelInfo {
    const baseInfo: GemmaModelInfo = {
      name: 'Gemma',
      version: '3n',
      contextWindow: 8192,
      maxTokens: 2048,
      multiModal: false,
      functionCalling: false,
      modelSize: 'latest',
    };

    // 모델 ID에 따른 특화 정보
    if (this.modelId.includes('3n')) {
      baseInfo.version = '3n';
    } else if (this.modelId.includes('2')) {
      baseInfo.version = '2';
      baseInfo.contextWindow = 4096;
    }

    // 모델 크기 감지
    if (this.modelId.includes('2b')) {
      baseInfo.modelSize = '2b';
      baseInfo.maxTokens = 1024;
    } else if (this.modelId.includes('7b')) {
      baseInfo.modelSize = '7b';
      baseInfo.maxTokens = 2048;
    }

    return baseInfo;
  }
}
