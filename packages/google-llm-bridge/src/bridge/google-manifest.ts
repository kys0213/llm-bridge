import { LlmManifest } from 'llm-bridge-spec';
import { GoogleAIConfigSchema } from './google-config';
import { GOOGLE_MODELS } from './google-models';

export const GOOGLE_MANIFEST: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'google-bridge',
  language: 'typescript',
  entry: 'src/bridge/google-bridge.ts',
  configSchema: GoogleAIConfigSchema,
  capabilities: {
    modalities: ['text'],
    supportsToolCall: false,
    supportsFunctionCall: false,
    supportsMultiTurn: true,
    supportsStreaming: false,
    supportsVision: false,
  },
  models: GOOGLE_MODELS,
  description: 'Google Gemini LLM Bridge',
};
