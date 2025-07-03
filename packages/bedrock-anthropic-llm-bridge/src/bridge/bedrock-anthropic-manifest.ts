import { LlmManifest } from 'llm-bridge-spec';

export const BEDROCK_ANTHROPIC_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'bedrock-anthropic-llm-bridge',
  language: 'typescript',
  entry: 'src/bridge/bedrock-anthropic-bridge.ts',
  configSchema: {
    type: 'object',
    properties: {
      region: {
        type: 'string',
        default: 'us-east-1',
      },
      modelId: {
        type: 'string',
        default: 'anthropic.claude-3-haiku-20240307-v1:0',
      },
      temperature: {
        type: 'number',
        default: 0.5,
      },
      topP: {
        type: 'number',
        default: 0.9,
      },
      maxTokens: {
        type: 'number',
        default: 1024,
      },
    },
  },
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  description: 'The bridge for Anthropic models on Amazon Bedrock',
};
