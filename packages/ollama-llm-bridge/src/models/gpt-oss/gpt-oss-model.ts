import { ConfigurationError, LlmBridgeCapabilities, LlmMetadata } from 'llm-bridge-spec';
import { AbstractOllamaModel } from '../base/abstract-ollama-model';
import {
  GptOssConfig,
  GptOssConfigSchema,
  GptOssModelInfo,
  SUPPORTED_GPT_OSS_MODELS,
} from './types';

export class GptOssModel extends AbstractOllamaModel<GptOssConfig> {
  constructor(modelId: string = 'gpt-oss-20:b') {
    super(modelId);
  }

  supportsModel(modelId: string): boolean {
    return (
      modelId.startsWith('gpt-oss') ||
      SUPPORTED_GPT_OSS_MODELS.some(model => modelId.includes(model.split(':')[0]))
    );
  }

  getSupportedModels(): string[] {
    return [...SUPPORTED_GPT_OSS_MODELS];
  }

  getCapabilities(): LlmBridgeCapabilities {
    return {
      modalities: ['text'],
      supportsToolCall: true,
      supportsFunctionCall: false,
      supportsMultiTurn: true,
      supportsStreaming: true,
      supportsVision: false,
    };
  }

  getMetadata(): LlmMetadata {
    const info = this.getModelInfo();
    return {
      name: info.name,
      version: info.version,
      description: `Ollama ${info.name} Bridge`,
      model: this.modelId,
      contextWindow: info.contextWindow,
      maxTokens: this.config?.num_predict ?? info.maxTokens,
    };
  }

  getDefaultConfig(): Partial<GptOssConfig> {
    return GptOssConfigSchema.parse({
      model: this.modelId,
      temperature: 0.7,
      num_predict: 4096,
    });
  }

  validateConfig(config: GptOssConfig): void {
    try {
      GptOssConfigSchema.parse(config);
    } catch (error) {
      throw new ConfigurationError(`Invalid GPT-OSS configuration: ${String(error)}`);
    }
  }

  private getModelInfo(): GptOssModelInfo {
    return {
      name: 'GPT-OSS',
      version: '20b',
      contextWindow: 4096,
      maxTokens: 4096,
      multiModal: false,
      functionCalling: false,
    };
  }
}
