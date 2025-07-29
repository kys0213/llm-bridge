import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { ModelNotSupportedError } from 'llm-bridge-spec';
import { BedrockBridge } from '../bridge/bedrock-bridge';
import { AbstractModel } from '../models/base/abstract-model';
import { AnthropicModel } from '../models/anthropic/anthropic-model';
import { MetaModel } from '../models/meta/meta-model';
import { BedrockConfig, BedrockConfigSchema } from '../bridge/types';
import { handleConfigurationError, handleFactoryError } from '../utils/error-handler';

/**
 * 모델 ID에 따라 적절한 ModelBridge를 생성합니다.
 */
function createModelBridge(modelId: string): AbstractModel<unknown, unknown> {
  const availableBridges = [new AnthropicModel(modelId), new MetaModel(modelId)];

  for (const bridge of availableBridges) {
    if (bridge.supportsModel(modelId)) {
      return bridge;
    }
  }

  throw new ModelNotSupportedError(modelId, ['anthropic.claude-*', 'meta.llama*']);
}

/**
 * Smart factory function to create BedrockBridge with properly configured dependencies
 * Includes runtime validation using Zod schema and automatic AWS client setup
 */
export function createBedrockBridge(config?: BedrockConfig): BedrockBridge {
  const parsedConfig = parseConfig(config);

  const modelBridge = createModelBridge(parsedConfig.modelId);

  try {
    // Apply defaults
    const validatedConfig: BedrockConfig = {
      region: 'us-east-1',
      ...parsedConfig,
    };

    // Set default modelId if not provided
    if (!validatedConfig.modelId) {
      validatedConfig.modelId = 'anthropic.claude-3-haiku-20240307-v1:0';
    }

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

    return new BedrockBridge(client, modelBridge, validatedConfig);
  } catch (error: unknown) {
    handleFactoryError(error, 'Bedrock');
  }
}

function parseConfig(config?: BedrockConfig) {
  try {
    return BedrockConfigSchema.parse(config ?? {});
  } catch (error: unknown) {
    handleConfigurationError(error, 'Bedrock');
  }
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
