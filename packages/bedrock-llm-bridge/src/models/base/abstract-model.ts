import {
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmBridgeCapabilities,
  LlmMetadata,
} from 'llm-bridge-spec';

/**
 * Abstract base class for all Bedrock model implementations
 * @template TRequestBody - The type of request body that buildRequestBody returns
 * @template TResponseBody - The type of response body that parseResponse accepts
 */
export abstract class AbstractModel<TRequestBody = unknown, TResponseBody = unknown> {
  constructor(protected modelId: string) {}

  /**
   * Build the request body for the specific model
   */
  abstract buildRequestBody(prompt: LlmBridgePrompt, option?: InvokeOption): TRequestBody;

  /**
   * Parse the response from the specific model
   */
  abstract parseResponse(response: TResponseBody): LlmBridgeResponse;

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
