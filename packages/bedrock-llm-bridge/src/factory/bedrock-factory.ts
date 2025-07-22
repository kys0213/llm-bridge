import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { BedrockBridge } from '../bridge/bedrock-bridge';
import { BedrockConfig, BedrockConfigSchema } from '../bridge/types';

/**
 * Smart factory function to create BedrockBridge with properly configured dependencies
 * Includes runtime validation using Zod schema and automatic AWS client setup
 */
export function createBedrockBridge(config?: BedrockConfig): BedrockBridge {
  // 런타임 검증 - 잘못된 설정이 들어오면 즉시 에러
  const parsedConfig = config
    ? BedrockConfigSchema.parse(config)
    : { modelId: 'anthropic.claude-3-haiku-20240307-v1:0' };

  // Apply defaults
  const validatedConfig: BedrockConfig = {
    region: 'us-east-1',
    ...parsedConfig,
  };

  const region = validatedConfig.region!;

  // Build AWS client configuration
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
  return new BedrockBridge(client, validatedConfig);
}

/**
 * Helper function to get default model suggestions based on use case
 */
export enum BedrockModels {
  // Anthropic Claude models
  CLAUDE_3_5_SONNET = 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  CLAUDE_3_SONNET = 'anthropic.claude-3-sonnet-20240229-v1:0',
  CLAUDE_3_HAIKU = 'anthropic.claude-3-haiku-20240307-v1:0',
  CLAUDE_3_OPUS = 'anthropic.claude-3-opus-20240229-v1:0',

  // Meta Llama models
  LLAMA_3_70B = 'meta.llama3-70b-instruct-v1:0',
  LLAMA_3_8B = 'meta.llama3-8b-instruct-v1:0',
  LLAMA_3_1_70B = 'meta.llama3-1-70b-instruct-v1:0',
  LLAMA_3_1_8B = 'meta.llama3-1-8b-instruct-v1:0',
}
