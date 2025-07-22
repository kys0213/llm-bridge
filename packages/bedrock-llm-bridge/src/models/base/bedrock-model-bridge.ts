import {
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmBridgeCapabilities,
  LlmMetadata,
} from 'llm-bridge-spec';

/**
 * Abstract base class for all Bedrock model implementations
 */
export abstract class BedrockModelBridge {
  constructor(protected modelId: string) {}

  /**
   * Build the request body for the specific model
   */
  abstract buildRequestBody(prompt: LlmBridgePrompt, option?: InvokeOption): any;

  /**
   * Parse the response from the specific model
   */
  abstract parseResponse(response: any): LlmBridgeResponse;

  /**
   * Get model-specific capabilities
   */
  abstract getCapabilities(): LlmBridgeCapabilities;

  /**
   * Get model metadata
   */
  abstract getMetadata(): LlmMetadata;

  /**
   * Get the model ID
   */
  getModelId(): string {
    return this.modelId;
  }

  /**
   * Check if this bridge supports the given model ID
   */
  abstract supportsModel(modelId: string): boolean;
}
