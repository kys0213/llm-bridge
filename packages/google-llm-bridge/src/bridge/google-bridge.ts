import {
  LlmBridge,
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmMetadata,
  StringContent,
} from 'llm-bridge-spec';
import type { GenerationConfig } from '@google/generative-ai';
import { GoogleAIConfig } from './google-config';
import { GoogleModelEnum, getModelMetadata } from './google-models';

export interface GenerativeModelLike {
  generateContent(request: any): Promise<{ response: { text(): string } }>;
}

export interface GenerativeAIClient {
  getGenerativeModel(option: { model: string }): GenerativeModelLike;
}

/**
 * Google Generative AI(Gemini) 브릿지 구현
 */
export class GoogleAIBridge implements LlmBridge {
  private model: GoogleModelEnum;

  constructor(
    private client: GenerativeAIClient,
    private config: GoogleAIConfig
  ) {
    this.model = config.model ?? GoogleModelEnum.GEMINI_1_5_FLASH;
  }

  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    const model = this.client.getGenerativeModel({ model: this.model });

    const contents = prompt.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: msg.content.filter(c => c.contentType === 'text').map(c => ({ text: c.value })),
    }));

    const generationConfig: GenerationConfig = {
      temperature: option?.temperature ?? this.config.temperature,
      topP: option?.topP ?? this.config.topP,
      topK: option?.topK ?? this.config.topK,
      maxOutputTokens: option?.maxTokens ?? this.config.maxOutputTokens,
      stopSequences: option?.stopSequence ?? this.config.stopSequences,
    };

    const result = await model.generateContent({ contents, generationConfig });
    const text = result.response?.text() ?? '';

    const content: StringContent = { contentType: 'text', value: text };

    return { content, usage: undefined, toolCalls: [] };
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'Google Gemini',
      version: getModelMetadata(this.model).version,
      description: 'Google Generative AI Gemini Bridge',
      model: this.model,
      contextWindow: getModelMetadata(this.model).contextWindowTokens,
      maxTokens: this.config.maxOutputTokens ?? getModelMetadata(this.model).maxTokens,
    };
  }
}
