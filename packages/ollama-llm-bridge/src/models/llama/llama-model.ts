import { ConfigurationError, LlmBridgeCapabilities, LlmMetadata } from 'llm-bridge-spec';
import { AbstractOllamaModel } from '../base/abstract-ollama-model';
import { LlamaConfig, LlamaConfigSchema, LlamaModelInfo, SUPPORTED_LLAMA_MODELS } from './types';

export class LlamaModel extends AbstractOllamaModel<LlamaConfig> {
  constructor(modelId: string = 'llama3.2') {
    super(modelId);
  }

  supportsModel(modelId: string): boolean {
    // Llama 모델 패턴 확인
    return (
      modelId.startsWith('llama') || SUPPORTED_LLAMA_MODELS.some(model => modelId.includes(model))
    );
  }

  getSupportedModels(): string[] {
    return [...SUPPORTED_LLAMA_MODELS];
  }

  getCapabilities(): LlmBridgeCapabilities {
    return {
      modalities: ['text', 'image'],
      supportsToolCall: true,
      supportsFunctionCall: true,
      supportsMultiTurn: false,
      supportsStreaming: true,
      supportsVision: false,
    };
  }

  getMetadata(): LlmMetadata {
    const metadata = this.getModelInfo();
    return {
      name: metadata.name,
      version: metadata.version,
      description: `Ollama ${metadata.name} Bridge`,
      model: this.modelId,
      contextWindow: metadata.contextWindow,
      maxTokens: metadata.maxTokens,
    };
  }

  getDefaultConfig(): Partial<LlamaConfig> {
    return LlamaConfigSchema.parse({
      model: this.modelId,
      temperature: 0.7,
      num_predict: 4096,
    });
  }

  validateConfig(config: LlamaConfig): void {
    try {
      LlamaConfigSchema.parse(config);
    } catch (error) {
      throw new ConfigurationError(`Invalid Llama configuration: ${String(error)}`);
    }
  }

  /**
   * Get model-specific information based on model ID
   */
  private getModelInfo(): LlamaModelInfo {
    const baseInfo = {
      name: 'Llama',
      version: '3.2',
      contextWindow: 8192,
      maxTokens: 4096,
      multiModal: false,
      functionCalling: false,
    };

    // 모델 ID에 따른 특화 정보
    if (this.modelId.includes('3.2')) {
      return { ...baseInfo, version: '3.2', multiModal: true };
    } else if (this.modelId.includes('3.1')) {
      return { ...baseInfo, version: '3.1', contextWindow: 32768, maxTokens: 8192 };
    } else if (this.modelId.includes('3')) {
      return { ...baseInfo, version: '3.0' };
    } else if (this.modelId.includes('2')) {
      return { ...baseInfo, version: '2.0', contextWindow: 4096, maxTokens: 2048 };
    }

    return baseInfo;
  }
}
