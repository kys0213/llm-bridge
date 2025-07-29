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
  InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { AbstractModel } from '../models/base/abstract-model';
import { BedrockConfig } from './types';
import { handleBedrockError, handleParsingError } from '../utils/error-handler';

export class BedrockBridge implements LlmBridge {
  constructor(
    private client: BedrockRuntimeClient,
    private modelBridge: AbstractModel<unknown, unknown>,
    private config: BedrockConfig
  ) {}

  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    try {
      const modelRequest = this.modelBridge.buildRequestBody(prompt, option);

      const command = new InvokeModelCommand({
        modelId: this.config.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(modelRequest),
      });

      const response = await this.client.send(command);
      return this.parse(response);
    } catch (error) {
      handleBedrockError(error, this.config.modelId, 'Bedrock');
    }
  }

  async *invokeStream(
    prompt: LlmBridgePrompt,
    option?: InvokeOption
  ): AsyncIterable<LlmBridgeResponse> {
    try {
      const modelRequest = this.modelBridge.buildRequestBody(prompt, option);

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: this.config.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(modelRequest),
      });

      const response = await this.client.send(command);

      if (!response.body) return;

      for await (const chunk of response.body) {
        if (chunk.chunk?.bytes) {
          try {
            const data = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
            const llmResponse = this.modelBridge.parseResponse(data);
            yield llmResponse;
          } catch (chunkError) {
            const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
            handleParsingError(chunkError, chunkText, 'Bedrock Stream');
          }
        }
      }
    } catch (error) {
      handleBedrockError(error, this.config.modelId, 'Bedrock');
    }
  }

  private parse(response: InvokeModelCommandOutput) {
    try {
      const body = response.body.transformToString('utf-8');
      const data = JSON.parse(body);
      return this.modelBridge.parseResponse(data);
    } catch (parseError) {
      handleParsingError(parseError, response.body.transformToString('utf-8'), 'Bedrock');
    }
  }

  async getMetadata(): Promise<LlmMetadata> {
    return this.modelBridge.getMetadata();
  }
}
