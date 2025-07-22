import {
  LlmBridge,
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmMetadata,
  StringContent,
  Message,
  MultiModalContent,
} from 'llm-bridge-spec';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Agent } from 'http';
import { z } from 'zod';

// Zod 스키마 정의
export const BedrockAnthropicConfigSchema = z.object({
  // AWS Configuration
  region: z.string().optional().describe('AWS region where Bedrock is available'),
  accessKeyId: z.string().optional().describe('AWS access key ID for authentication'),
  secretAccessKey: z.string().optional().describe('AWS secret access key for authentication'),
  sessionToken: z.string().optional().describe('AWS session token (for temporary credentials)'),
  profile: z.string().optional().describe('AWS profile name to use from credentials file'),
  endpoint: z
    .string()
    .optional()
    .describe('Custom endpoint URL (useful for LocalStack or testing)'),

  // Model Configuration
  modelId: z.string().optional().describe('Anthropic model ID to use'),

  // Network Configuration
  httpAgent: z.instanceof(Agent).optional().describe('Custom HTTP agent for requests'),

  // Model Parameters (defaults)
  temperature: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Sampling temperature for response generation'),
  maxTokens: z.number().min(1).optional().describe('Maximum number of tokens to generate'),
  stopSequences: z
    .array(z.string())
    .optional()
    .describe('Array of strings that will stop generation'),
});

// 타입 추출
export type BedrockAnthropicConfig = z.infer<typeof BedrockAnthropicConfigSchema>;

export class BedrockAnthropicBridge implements LlmBridge {
  private config: BedrockAnthropicConfig;
  private modelId: string;

  constructor(
    private client: BedrockRuntimeClient,
    config?: BedrockAnthropicConfig
  ) {
    this.config = config ?? {};
    this.modelId = this.config.modelId ?? 'anthropic.claude-3-haiku-20240307-v1:0';
  }

  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    const messages = prompt.messages.map(m => this.toAnthropicMessage(m));

    const body = {
      messages,
      temperature: option?.temperature ?? this.config.temperature,
      top_p: option?.topP,
      top_k: option?.topK,
      max_tokens: option?.maxTokens ?? this.config.maxTokens,
      stop_sequences: option?.stopSequence ?? this.config.stopSequences,
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await this.client.send(command);
    const bodyBytes = response.body as Uint8Array;
    const text = new TextDecoder().decode(bodyBytes);
    const data = JSON.parse(text);

    const content: StringContent = {
      contentType: 'text',
      value: data.content ?? data.completion ?? data.result ?? data.output ?? '',
    };

    const usage = data.usage
      ? {
          promptTokens: data.usage.input_tokens ?? 0,
          completionTokens: data.usage.output_tokens ?? 0,
          totalTokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
        }
      : undefined;

    return { content, usage };
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'Anthropic Claude',
      version: '3',
      description: 'Amazon Bedrock Anthropic LLM Bridge',
      model: this.modelId,
      contextWindow: 200000,
      maxTokens: 4096,
    };
  }

  private toAnthropicMessage(message: Message): { role: string; content: string } {
    if (message.role === 'tool') {
      const tool = message;
      const texts = tool.content
        .filter((c): c is StringContent => this.isStringContent(c))
        .map(c => c.value);
      return { role: tool.role, content: texts.join('\n') };
    }

    if (this.isStringContent(message.content)) {
      return { role: message.role, content: message.content.value };
    }

    return { role: message.role, content: '' };
  }

  private isStringContent(content: MultiModalContent): content is StringContent {
    return (content as StringContent).contentType === 'text';
  }
}

/**
 * Factory function to create BedrockAnthropicBridge with properly configured dependencies
 * Includes runtime validation using Zod schema
 */
export function createBedrockAnthropicBridge(config?: unknown): BedrockAnthropicBridge {
  // 런타임 검증 - 잘못된 설정이 들어오면 즉시 에러
  const parsedConfig = config ? BedrockAnthropicConfigSchema.parse(config) : {};

  // Apply defaults
  const validatedConfig: BedrockAnthropicConfig = {
    region: 'us-east-1',
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    ...parsedConfig,
  };

  const region = validatedConfig.region!;

  // Build client configuration
  const clientConfig: Record<string, unknown> = { region };

  // Add AWS credentials if provided
  if (validatedConfig.accessKeyId && validatedConfig.secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId: validatedConfig.accessKeyId,
      secretAccessKey: validatedConfig.secretAccessKey,
      ...(validatedConfig.sessionToken && { sessionToken: validatedConfig.sessionToken }),
    };
  }

  // Add profile if provided (alternative to explicit credentials)
  if (validatedConfig.profile) {
    // Note: Profile is handled by AWS SDK automatically via AWS_PROFILE env var
    // or ~/.aws/credentials file, but we can set it explicitly
    process.env.AWS_PROFILE = validatedConfig.profile;
  }

  // Add custom endpoint if provided (useful for LocalStack or custom endpoints)
  if (validatedConfig.endpoint) {
    clientConfig.endpoint = validatedConfig.endpoint;
  }

  // Add custom HTTP handler if provided
  if (validatedConfig.httpAgent) {
    clientConfig.requestHandler = new NodeHttpHandler({
      httpAgent: validatedConfig.httpAgent,
    });
  }

  const client = new BedrockRuntimeClient(clientConfig);
  return new BedrockAnthropicBridge(client, validatedConfig);
}
