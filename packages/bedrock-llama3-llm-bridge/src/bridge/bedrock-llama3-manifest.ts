import { LlmManifest } from 'llm-bridge-spec';

export const BEDROCK_LLAMA3_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'bedrock-llama3-bridge',
  language: 'typescript',
  entry: 'src/bridge/bedrock-llama3-bridge.ts',
  configSchema: {
    type: 'object',
    properties: {
      region: {
        type: 'string',
        default: 'us-east-1',
      },
      modelId: {
        type: 'string',
        default: 'meta.llama3-70b-instruct-v1:0',
      },
      temperature: {
        type: 'number',
        default: 0.7,
      },
      topP: {
        type: 'number',
        default: 0.9,
      },
      maxTokens: {
        type: 'number',
        default: 1000,
      },
      stopSequences: {
        type: 'array',
        default: [],
      },
    },
  },
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: false,
  },
  description: 'Amazon Bedrock Llama3 bridge',
};
