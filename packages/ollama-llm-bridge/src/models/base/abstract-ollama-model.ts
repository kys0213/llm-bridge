import {
  Message as BridgeMessage,
  InvokeOption,
  LlmBridgeCapabilities,
  LlmBridgePrompt,
  LlmBridgeResponse,
  LlmMetadata,
  MultiModalContentHelper,
} from 'llm-bridge-spec';
import { ChatRequest, ChatResponse, Message, Tool } from 'ollama';
import { v4 as uuidv4 } from 'uuid';
import { OllamaBaseConfig } from '../../types/config';

/**
 * Abstract base class for all Ollama model implementations
 * @template TConfig - The type of model-specific configuration
 */
export abstract class AbstractOllamaModel<TConfig extends OllamaBaseConfig = OllamaBaseConfig> {
  constructor(protected modelId: string) {}

  /**
   * Build the Ollama chat request for the specific model
   */
  buildChatRequest(prompt: LlmBridgePrompt, options?: InvokeOption): ChatRequest {
    const tools: Tool[] = this.parseTools(options);
    const messages: Message[] = prompt.messages.map(m => this.parseMessage(m));

    return {
      model: this.modelId,
      messages,
      tools,
      options: {
        temperature: options?.temperature,
        top_p: options?.topP,
        top_k: options?.topK,
        num_predict: options?.maxTokens,
        stop: options?.stopSequence,
      },
      stream: false,
    };
  }

  private parseMessage(message: BridgeMessage): Message {
    const texts = message.content
      .filter(c => MultiModalContentHelper.isStringContent(c))
      .map(c => c.value);

    const images = message.content
      .filter(c => MultiModalContentHelper.isImageContent(c) && c.value instanceof Buffer)
      .map(c => c.value.toString('base64'));

    return {
      role: message.role,
      content: texts.join('\n'),
      images,
    };
  }

  private parseTools(options?: InvokeOption): Tool[] {
    return (
      options?.tools?.map(
        (tool): Tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })
      ) ?? []
    );
  }

  /**
   * Parse the Ollama response for the specific model
   */

  parseResponse(response: ChatResponse): LlmBridgeResponse {
    return {
      content: {
        contentType: 'text',
        value: response.message.content,
      },
      toolCalls: response.message.tool_calls?.map(toolCall => ({
        toolCallId: uuidv4(),
        name: toolCall.function.name,
        arguments: toolCall.function.arguments,
      })),
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
    };
  }

  /**
   * Get model-specific capabilities
   */
  abstract getCapabilities(): LlmBridgeCapabilities;

  /**
   * Get model metadata
   */
  abstract getMetadata(): LlmMetadata;

  /**
   * Get the default configuration for this model
   */
  abstract getDefaultConfig(): Partial<TConfig>;

  /**
   * Check if this model supports the given model ID
   */
  abstract supportsModel(modelId: string): boolean;

  /**
   * Get the model ID
   */
  getModelId(): string {
    return this.modelId;
  }

  /**
   * Get supported model patterns for this model type
   */
  abstract getSupportedModels(): string[];

  /**
   * Validate model-specific configuration
   */
  validateConfig(_config: TConfig): void {
    // Base validation can be implemented here
    // Individual models can override this for specific validation
  }
}
