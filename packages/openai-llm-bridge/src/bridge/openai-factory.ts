import OpenAI from 'openai';
import { OpenAIBridge } from './openai-bridge';
import { OpenAIConfig, OpenAIConfigSchema } from './openai-config';

/**
 * Factory function to create OpenAIBridge with properly configured dependencies
 * Includes runtime validation using Zod schema
 */
export function createOpenAIBridge(config: OpenAIConfig): OpenAIBridge {
  // 런타임 검증 - 잘못된 설정이 들어오면 즉시 에러
  const parsedConfig = OpenAIConfigSchema.parse(config);

  // OpenAI 클라이언트 생성
  const client = new OpenAI({
    apiKey: parsedConfig.apiKey,
    baseURL: parsedConfig.baseURL,
    organization: parsedConfig.organization,
    project: parsedConfig.project,
    timeout: parsedConfig.timeout,
    maxRetries: parsedConfig.maxRetries,
  });

  return new OpenAIBridge(client, parsedConfig);
}
