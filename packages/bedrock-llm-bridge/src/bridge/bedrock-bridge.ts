import {
  LlmBridge,
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmMetadata,
} from 'llm-bridge-spec';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  ResponseStream,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockModelBridge } from '../models/base/bedrock-model-bridge';
import { AnthropicModelBridge } from '../models/anthropic/anthropic-model-bridge';
import { MetaModelBridge } from '../models/meta/meta-model-bridge';
import { BedrockConfig } from './types';

export class BedrockBridge implements LlmBridge {
  private modelBridge: BedrockModelBridge;
  private config: BedrockConfig;

  constructor(
    private client: BedrockRuntimeClient,
    config: BedrockConfig
  ) {
    this.config = config;
    this.modelBridge = this.createModelBridge(config.modelId);
  }

  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    // 설정에서 기본값 적용
    const mergedOptions = this.mergeOptionsWithConfig(option);

    const body = this.modelBridge.buildRequestBody(prompt, mergedOptions);
    const command = new InvokeModelCommand({
      modelId: this.config.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await this.client.send(command);
    const bodyBytes = response.body as Uint8Array;
    const text = new TextDecoder().decode(bodyBytes);
    const data = JSON.parse(text);

    return this.modelBridge.parseResponse(data);
  }

  async *invokeStream(
    prompt: LlmBridgePrompt,
    option?: InvokeOption
  ): AsyncIterable<LlmBridgeResponse> {
    // 설정에서 기본값 적용
    const mergedOptions = this.mergeOptionsWithConfig(option);

    const body = this.modelBridge.buildRequestBody(prompt, mergedOptions);
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: this.config.modelId,
      body: JSON.stringify(body),
    });

    const response = await this.client.send(command);
    for await (const chunk of response.body as AsyncIterable<ResponseStream>) {
      if ('chunk' in chunk && chunk.chunk?.bytes) {
        const payload = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
        yield this.modelBridge.parseResponse(payload);
      }
    }
  }

  async getMetadata(): Promise<LlmMetadata> {
    return this.modelBridge.getMetadata();
  }

  private createModelBridge(modelId: string): BedrockModelBridge {
    // 모델 ID에 따라 적절한 구현체 선택
    const availableBridges = [new AnthropicModelBridge(modelId), new MetaModelBridge(modelId)];

    for (const bridge of availableBridges) {
      if (bridge.supportsModel(modelId)) {
        return bridge;
      }
    }

    throw new Error(
      `Unsupported model: ${modelId}. Supported models: anthropic.claude-*, meta.llama*`
    );
  }

  private mergeOptionsWithConfig(option?: InvokeOption): InvokeOption {
    return {
      temperature: option?.temperature ?? this.config.temperature,
      topP: option?.topP ?? this.config.topP,
      topK: option?.topK ?? this.config.topK,
      maxTokens: option?.maxTokens ?? this.config.maxTokens,
      stopSequence: option?.stopSequence ?? this.config.stopSequences,
    };
  }
}
