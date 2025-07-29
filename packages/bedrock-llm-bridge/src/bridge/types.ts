import { z } from 'zod';
import { Agent } from 'http';

// 통합 Bedrock 설정 스키마
export const BedrockConfigSchema = z.object({
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
  modelId: z
    .string()
    .describe(
      'Model ID (e.g., anthropic.claude-3-sonnet-20240229-v1:0, meta.llama3-70b-instruct-v1:0)'
    ),

  // Network Configuration
  httpAgent: z.instanceof(Agent).optional().describe('Custom HTTP agent for requests'),

  // Model Parameters (defaults)
  temperature: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Sampling temperature for response generation'),
  topP: z.number().min(0).max(1).optional().describe('Top-p nucleus sampling parameter'),
  topK: z.number().min(0).optional().describe('Top-k sampling parameter (Anthropic only)'),
  maxTokens: z.number().min(1).optional().describe('Maximum number of tokens to generate'),
  stopSequences: z
    .array(z.string())
    .optional()
    .describe('Array of strings that will stop generation'),
});

// 타입 추출
export type BedrockConfig = z.infer<typeof BedrockConfigSchema>;
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
